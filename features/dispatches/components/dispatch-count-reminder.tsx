"use client";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useCountReminder } from "../hooks/use-count-reminder";
import { receivingTime } from "../services/receiving-time";
import type { DispatchListItem } from "../types/dispatch.types";

type ReminderDispatch = Pick<
  DispatchListItem,
  "id" | "branch_name" | "receiving_status" | "count_reminder"
>;
export function DispatchCountReminder({
  dispatch,
  allowed,
  menu = false,
}: {
  dispatch: ReminderDispatch;
  allowed: boolean;
  menu?: boolean;
}) {
  if (!allowed || !dispatch.count_reminder) return null;
  if (
    !["AWAITING_COUNT", "OVERDUE"].includes(dispatch.receiving_status ?? "")
  ) {
    return !menu && dispatch.count_reminder.last_sent_at ? (
      <p className="text-xs text-muted-foreground">
        Last reminded {receivingTime(dispatch.count_reminder.last_sent_at)} PHT
      </p>
    ) : null;
  }
  return (
    <CountReminderControl
      dispatch={dispatch}
      metadata={dispatch.count_reminder}
      menu={menu}
    />
  );
}
function CountReminderControl({
  dispatch,
  metadata,
  menu,
}: {
  dispatch: ReminderDispatch;
  metadata: NonNullable<ReminderDispatch["count_reminder"]>;
  menu: boolean;
}) {
  const reminder = useCountReminder(
    dispatch.id,
    dispatch.branch_name,
    metadata,
  );
  const label = reminder.pending
    ? "Sending reminder…"
    : menu
      ? "Remind branch"
      : "Remind branch to submit count";
  const hint =
    reminder.coolingDown && reminder.nextAllowed
      ? `Available again ${receivingTime(reminder.nextAllowed)} PHT`
      : undefined;
  if (menu)
    return (
      <DropdownMenuItem
        disabled={reminder.pending || reminder.coolingDown}
        closeOnClick={false}
        onClick={reminder.send}
      >
        <BellRing
          aria-hidden="true"
          className="text-amber-600 dark:text-amber-400"
        />
        <span className="flex flex-col gap-1">
          <span>{label}</span>
          {hint && (
            <span className="text-xs font-normal text-muted-foreground">
              {hint}
            </span>
          )}
        </span>
      </DropdownMenuItem>
    );
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <div
        className="space-y-1 text-xs text-muted-foreground"
        aria-live="polite"
      >
        {reminder.lastSent && (
          <p>Last reminded {receivingTime(reminder.lastSent)} PHT</p>
        )}
        {hint && <p>{hint}</p>}
      </div>
      <Button
        type="button"
        variant="outline"
        className="min-h-10 max-w-full whitespace-normal"
        disabled={reminder.pending || reminder.coolingDown}
        onClick={reminder.send}
      >
        <BellRing aria-hidden="true" />
        {label}
      </Button>
    </div>
  );
}
