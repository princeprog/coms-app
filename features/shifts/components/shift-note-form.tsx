"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import type { ShiftDetail } from "../schemas/shift.schema";
import {
  explainShiftAction,
  reviewShiftAction,
} from "../services/shift-actions";
import { differenceTone } from "../services/shift-money";

const hasDifference = (shift: ShiftDetail) =>
  differenceTone(shift.cash_difference) !== "balanced" ||
  differenceTone(shift.opening_difference) !== "balanced";

export function ShiftNoteForm({
  branchId,
  shift,
  mode,
  onSaved,
}: {
  branchId: string;
  shift: ShiftDetail;
  mode: "review" | "explain";
  onSaved: () => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const required = mode === "explain" || hasDifference(shift);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (required && !note.trim()) {
      setError(
        mode === "review"
          ? "Add a note about the cash difference"
          : "Enter an explanation",
      );
      return;
    }
    setPending(true);
    setError("");
    const result =
      mode === "review"
        ? await reviewShiftAction(branchId, shift.id, note.trim())
        : await explainShiftAction(branchId, shift.id, note.trim());
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.add({
      type: "success",
      title:
        mode === "review"
          ? `Shift ${shift.shift_number} reviewed`
          : "Explanation saved",
    });
    onSaved();
  }
  const id = `shift-${mode}-note`;
  return (
    <form
      id={mode === "review" ? "review" : undefined}
      onSubmit={submit}
      noValidate
      className="flex scroll-mt-6 flex-col gap-3 rounded-2xl bg-card p-5 shadow-xs ring-1 ring-foreground/10 sm:p-6"
    >
      <h2 className="text-base font-semibold">
        {mode === "review" ? "Review shift" : "Explain the difference"}
      </h2>
      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor={id}>
          {mode === "review" ? "Review note" : "What happened?"}
          {!required && (
            <span className="font-normal text-muted-foreground">
              {" "}
              (optional)
            </span>
          )}
        </FieldLabel>
        <Textarea
          id={id}
          rows={3}
          maxLength={500}
          value={note}
          disabled={pending}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => {
            setNote(event.target.value);
            setError("");
          }}
        />
        {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      </Field>
      <Button type="submit" className="min-h-11 w-fit gap-2" disabled={pending}>
        {pending && (
          <LoaderCircle
            className="animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}
        {mode === "review" ? "Mark reviewed" : "Save explanation"}
      </Button>
    </form>
  );
}
