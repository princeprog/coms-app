"use client";

import { useState } from "react";
import {
  CalendarOff,
  CalendarSync,
  Plus,
  Undo2,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  addScheduleExceptionAction,
  removeScheduleExceptionAction,
} from "../services/schedule-actions";
import { shortDate } from "../services/schedule-format";
import type {
  CellPerson,
  ScheduleCell as Cell,
} from "../services/schedule-grid";
import { DayOffDialog } from "./day-off-dialog";

const chip =
  "inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-[background-color,scale] duration-150 ease-out";
const tones = {
  PATTERN:
    "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-100",
  EXTRA:
    "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-100",
  OFF: "border-dashed bg-transparent text-muted-foreground line-through",
} as const;
const labels = { PATTERN: "", EXTRA: "extra shift", OFF: "day off" } as const;

export function ScheduleCell({
  branchId,
  shift,
  date,
  cell,
  editable,
  onChanged,
  onEditPattern,
}: {
  branchId: string;
  shift: { id: string; name: string };
  date: string;
  cell: Cell;
  editable: boolean;
  onChanged: () => void;
  onEditPattern: (userId: string) => void;
}) {
  const [dayOff, setDayOff] = useState<CellPerson | null>(null);
  const [pending, setPending] = useState(false);
  const working = cell.people.filter((person) => person.kind !== "OFF");
  const when = `${shift.name}, ${shortDate(date)}`;

  async function run(
    action: () => Promise<{ ok: true } | { ok: false; error: string }>,
    message: string,
  ) {
    setPending(true);
    const result = await action();
    setPending(false);
    if (!result.ok) {
      toast.add({ type: "error", title: result.error });
      return;
    }
    toast.add({ type: "success", title: message });
    onChanged();
  }

  const addPerson = (member: { user_id: string; full_name: string }) =>
    run(
      () =>
        addScheduleExceptionAction(branchId, {
          user_id: member.user_id,
          template_id: shift.id,
          work_date: date,
          kind: "EXTRA",
        }),
      `${member.full_name} added to ${when}`,
    );
  const removeChange = (person: CellPerson, message: string) =>
    run(
      () => removeScheduleExceptionAction(branchId, person.exception_id),
      message,
    );

  return (
    <div aria-busy={pending} className="flex min-h-9 flex-col gap-1.5">
      <ul aria-label={when} className="flex flex-wrap gap-1">
        {cell.people.map((person) => {
          const content = (
            <>
              <span className="truncate">{person.full_name}</span>
              {labels[person.kind] && (
                <span className="sr-only">, {labels[person.kind]}</span>
              )}
            </>
          );
          return (
            <li key={`${person.user_id}-${person.kind}`} className="max-w-full">
              {editable ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        disabled={pending}
                        title={person.reason ?? undefined}
                        className={cn(
                          chip,
                          tones[person.kind],
                          "cursor-pointer outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-97 motion-reduce:active:scale-100",
                        )}
                      />
                    }
                  >
                    {person.kind === "EXTRA" && (
                      <Plus aria-hidden="true" className="size-3" />
                    )}
                    {content}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-56">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>{person.full_name}</DropdownMenuLabel>
                      {person.kind === "PATTERN" && (
                        <DropdownMenuItem onClick={() => setDayOff(person)}>
                          <CalendarOff
                            aria-hidden="true"
                            className="stroke-amber-600 dark:stroke-amber-400"
                          />
                          Mark day off
                        </DropdownMenuItem>
                      )}
                      {person.kind === "EXTRA" && (
                        <DropdownMenuItem
                          onClick={() =>
                            void removeChange(
                              person,
                              `${person.full_name} removed from ${when}`,
                            )
                          }
                        >
                          <X
                            aria-hidden="true"
                            className="stroke-destructive"
                          />
                          Remove from this day
                        </DropdownMenuItem>
                      )}
                      {person.kind === "OFF" && (
                        <DropdownMenuItem
                          onClick={() =>
                            void removeChange(
                              person,
                              `${person.full_name} is back on ${when}`,
                            )
                          }
                        >
                          <Undo2
                            aria-hidden="true"
                            className="stroke-emerald-600 dark:stroke-emerald-400"
                          />
                          Cancel day off
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onEditPattern(person.user_id)}
                      >
                        <CalendarSync
                          aria-hidden="true"
                          className="stroke-blue-600 dark:stroke-blue-400"
                        />
                        Edit weekly pattern
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span
                  title={person.reason ?? undefined}
                  className={cn(chip, tones[person.kind])}
                >
                  {person.kind === "EXTRA" && (
                    <Plus aria-hidden="true" className="size-3" />
                  )}
                  {content}
                </span>
              )}
            </li>
          );
        })}
        {editable && cell.available.length > 0 && (
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={pending}
                    className="text-muted-foreground"
                    aria-label={`Add someone to ${when}`}
                  />
                }
              >
                <Plus aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-72 min-w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Add for this day only</DropdownMenuLabel>
                  {cell.available.map((member) => (
                    <DropdownMenuItem
                      key={member.user_id}
                      onClick={() => void addPerson(member)}
                    >
                      <UserRound
                        aria-hidden="true"
                        className="stroke-violet-600 dark:stroke-violet-400"
                      />
                      {member.full_name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        )}
      </ul>
      {cell.runs && working.length === 0 && (
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
          No one scheduled
        </span>
      )}
      {!cell.runs && cell.people.length === 0 && (
        <span className="text-xs text-muted-foreground/70">Not running</span>
      )}
      {dayOff && (
        <DayOffDialog
          branchId={branchId}
          person={dayOff}
          shift={shift}
          date={date}
          onClose={() => setDayOff(null)}
          onSaved={() => {
            setDayOff(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
