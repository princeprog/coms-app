"use client";

import { useState, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  onComplete,
  onDirtyChange,
  onPendingChange,
}: {
  id: string;
  initialName: string;
  onComplete: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const dirty = name !== savedName;

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
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={submit}
    >
      <FieldGroup className="flex-1 gap-2">
        <Field>
          <FieldLabel htmlFor={`role-name-${id}`}>Role name</FieldLabel>
          <Input
            id={`role-name-${id}`}
            disabled={pending}
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
          <FieldDescription>
            This name appears in staff role assignments.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <Button type="submit" variant="outline" disabled={pending || !dirty}>
        {pending ? "Saving…" : "Save role name"}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Role name was not saved</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {status && (
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      )}
    </form>
  );
}
