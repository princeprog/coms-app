"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useRetryKey } from "../hooks/use-retry-key";
import { pesoInputSchema } from "../schemas/shift.schema";
import { openShiftAction } from "../services/shift-actions";
import { focusFirstInvalid } from "../services/focus-invalid";
import { PesoField } from "./peso-field";
import { ShiftDialogShell } from "./shift-dialog-shell";

export function OpenShiftDialog({
  branchId,
  onClose,
  onOpened,
}: {
  branchId: string;
  onClose: () => void;
  onOpened: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const keyFor = useRetryKey();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = pesoInputSchema.safeParse(amount);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter an amount");
      focusFirstInvalid(event.currentTarget);
      return;
    }
    setPending(true);
    setError("");
    const result = await openShiftAction(
      branchId,
      parsed.data,
      keyFor(parsed.data),
    );
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.add({
      type: "success",
      title: `Shift ${result.data.shift_number} opened`,
    });
    onOpened();
  }
  return (
    <ShiftDialogShell
      title="Open shift"
      description="Count the cash in the drawer before your first sale."
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
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            {pending ? "Opening…" : "Open shift"}
          </Button>
        </>
      }
    >
      <PesoField
        id="shift-opening-float"
        label="Cash in drawer"
        value={amount}
        onChange={(value) => {
          setAmount(value);
          setError("");
        }}
        error={error}
        disabled={pending}
        autoFocus
      />
    </ShiftDialogShell>
  );
}
