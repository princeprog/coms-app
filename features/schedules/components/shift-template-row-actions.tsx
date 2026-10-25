"use client";

import { useState, type FormEvent } from "react";
import {
  LoaderCircle,
  MoreVertical,
  Power,
  RotateCcw,
  SquarePen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import type { ShiftTemplate } from "../schemas/schedule.schema";
import { setShiftTemplateActiveAction } from "../services/schedule-actions";
import { FormAlert, ScheduleDialogShell } from "./schedule-dialog-shell";
import { ShiftTemplateDialog } from "./shift-template-dialog";

export function ShiftTemplateRowActions({
  branchId,
  template,
  dayStartTimes,
  onChanged,
}: {
  branchId: string;
  template: ShiftTemplate;
  dayStartTimes: string[];
  onChanged: () => void;
}) {
  const [dialog, setDialog] = useState<"edit" | "status" | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function changeStatus(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setPending(true);
    setError(undefined);
    const result = await setShiftTemplateActiveAction(
      branchId,
      template.id,
      !template.is_active,
    );
    setPending(false);
    if (!result.ok) {
      if (dialog === "status") setError(result.error);
      else toast.add({ type: "error", title: result.error });
      return;
    }
    toast.add({
      type: "success",
      title: `${template.name} ${template.is_active ? "deactivated" : "reactivated"}`,
    });
    setDialog(null);
    onChanged();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-11 sm:size-9"
              aria-label={`Actions for ${template.name}`}
            />
          }
        >
          <MoreVertical aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setDialog("edit")}>
              <SquarePen
                aria-hidden="true"
                className="stroke-blue-600 dark:stroke-blue-400"
              />
              Edit shift
            </DropdownMenuItem>
            {template.is_active ? (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDialog("status")}
              >
                <Power aria-hidden="true" className="stroke-destructive" />
                Deactivate shift
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                disabled={pending}
                onClick={() => void changeStatus()}
              >
                <RotateCcw
                  aria-hidden="true"
                  className="stroke-emerald-600 dark:stroke-emerald-400"
                />
                Reactivate shift
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {dialog === "edit" && (
        <ShiftTemplateDialog
          branchId={branchId}
          template={template}
          dayStartTimes={dayStartTimes}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            onChanged();
          }}
        />
      )}
      {dialog === "status" && (
        <ScheduleDialogShell
          title={`Deactivate ${template.name}?`}
          description="It leaves the schedule from today. Staff assignments are kept, so reactivating brings them back."
          pending={pending}
          onClose={() => setDialog(null)}
          onSubmit={changeStatus}
          footer={
            <>
              <Button
                type="button"
                variant="ghost"
                className="min-h-11"
                disabled={pending}
                onClick={() => setDialog(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="min-h-11 gap-2"
                disabled={pending}
              >
                {pending && (
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin motion-reduce:animate-none"
                  />
                )}
                Deactivate shift
              </Button>
            </>
          }
        >
          <FormAlert message={error} />
        </ScheduleDialogShell>
      )}
    </>
  );
}
