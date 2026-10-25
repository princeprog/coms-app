"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { addScheduleExceptionAction } from "../services/schedule-actions";
import { shortDate } from "../services/schedule-format";
import { FormAlert, ScheduleDialogShell } from "./schedule-dialog-shell";

export function DayOffDialog({
  branchId,
  person,
  shift,
  date,
  onClose,
  onSaved,
}: {
  branchId: string;
  person: { user_id: string; full_name: string };
  shift: { id: string; name: string };
  date: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const result = await addScheduleExceptionAction(branchId, {
      user_id: person.user_id,
      template_id: shift.id,
      work_date: date,
      kind: "OFF",
      reason: reason.trim() || undefined,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.add({
      type: "success",
      title: `${person.full_name} is off on ${shortDate(date)}`,
    });
    onSaved();
  }
  return (
    <ScheduleDialogShell
      title="Mark day off"
      description={`${person.full_name} won't work ${shift.name} on ${shortDate(date)}. Their weekly pattern stays the same.`}
      pending={pending}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" className="min-h-11 gap-2" disabled={pending}>
            {pending && (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
            )}
            Mark day off
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="day-off-reason">Reason (optional)</FieldLabel>
          <Input
            id="day-off-reason"
            className="h-11"
            maxLength={200}
            placeholder="e.g. Sick leave, swapped with Ben"
            value={reason}
            autoFocus
            disabled={pending}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <FormAlert message={error} />
      </div>
    </ScheduleDialogShell>
  );
}
