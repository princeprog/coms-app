"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useLateCountReview } from "../hooks/use-late-count-review";
export function LateCountActions({
  dispatchId,
  caseId,
  blocked,
}: {
  dispatchId: string;
  caseId: string;
  blocked: boolean;
}) {
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const mutation = useLateCountReview(dispatchId, caseId);
  const [returning, setReturning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="space-y-3">
      {returning && (
        <Field>
          <FieldLabel htmlFor="return-count-reason">
            Reason for correction
          </FieldLabel>
          <Textarea
            id="return-count-reason"
            ref={reasonRef}
            aria-invalid={!!error}
            aria-describedby={error ? "return-count-error" : undefined}
            maxLength={500}
            value={reason}
            disabled={mutation.isPending}
            onChange={(e) => {
              setReason(e.target.value);
              setError("");
            }}
          />
          {error && <FieldError id="return-count-error">{error}</FieldError>}
        </Field>
      )}
      {confirming && <p>Post the saved count and update branch stock?</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={blocked || mutation.isPending || returning}
          onClick={() =>
            confirming
              ? mutation.mutate({ action: "POST" })
              : setConfirming(true)
          }
        >
          {mutation.isPending
            ? "Saving…"
            : confirming
              ? "Confirm posting"
              : "Post saved count"}
        </Button>
        <Button
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => {
            if (!returning) {
              setReturning(true);
              setConfirming(false);
              return;
            }
            if (!reason.trim()) {
              setError("Enter a reason.");
              reasonRef.current?.focus();
              return;
            }
            mutation.mutate({ action: "RETURN", reason: reason.trim() });
          }}
        >
          Return for correction
        </Button>
        {(returning || confirming) && (
          <Button
            variant="ghost"
            disabled={mutation.isPending}
            onClick={() => {
              setReturning(false);
              setConfirming(false);
            }}
          >
            Cancel
          </Button>
        )}
      </div>
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {mutation.error.message}
        </p>
      )}
    </div>
  );
}
