"use client";

import { useState, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateRoleNameAction } from "@/features/roles/services/role-actions";
import type { RoleMutationResult } from "@/features/roles/types/role.types";

export function RoleNameForm({
  id,
  initialName,
  code,
  disabled,
  onComplete,
  onDirtyChange,
  onPendingChange,
}: {
  id: string;
  initialName: string;
  code: string;
  disabled: boolean;
  onComplete: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setPending(true);
    onPendingChange(true);
    let result: RoleMutationResult;
    try {
      result = await updateRoleNameAction(id, { role_name: name });
    } catch {
      setPending(false);
      onPendingChange(false);
      setError("COMS could not complete this change. Try again.");
      return;
    }
    setPending(false);
    onPendingChange(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSavedName(name);
    onDirtyChange(false);
    setStatus("Role name updated.");
    onComplete();
  }

  return (
    <form
      id={`role-name-form-${id}`}
      className="flex min-h-0 flex-col gap-2"
      onSubmit={submit}
    >
      <FieldGroup className="gap-2 min-[360px]:grid min-[360px]:grid-cols-2 lg:flex lg:gap-5">
        <Field>
          <FieldLabel htmlFor={`role-name-${id}`}>Role name</FieldLabel>
          <Input
            id={`role-name-${id}`}
            disabled={disabled || pending}
            required
            minLength={2}
            maxLength={160}
            value={name}
            onChange={(event) => {
              const nextName = event.currentTarget.value;
              setName(nextName);
              setStatus("");
              onDirtyChange(nextName !== savedName);
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`role-code-${id}`}>Role code</FieldLabel>
          <Input
            id={`role-code-${id}`}
            value={code}
            readOnly
            aria-describedby={`role-code-help-${id}`}
            className="font-mono"
          />
          <FieldDescription
            id={`role-code-help-${id}`}
            data-role-compact-description
            className="text-xs"
          >
            This code is permanent and cannot be changed.
          </FieldDescription>
        </Field>
      </FieldGroup>
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertTitle>Role name was not saved</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {status && (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {status}
        </p>
      )}
    </form>
  );
}
