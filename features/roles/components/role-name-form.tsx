"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateRoleNameAction } from "@/features/roles/services/role-actions";
import type { RoleMutationResult } from "@/features/roles/types/role.types";

export function RoleNameForm({
  id,
  initialName,
  onComplete,
}: {
  id: string;
  initialName: string;
  onComplete: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    let result: RoleMutationResult;
    try {
      result = await updateRoleNameAction(id, { role_name: name });
    } catch {
      setPending(false);
      setError("COMS could not complete this change. Try again.");
      return;
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onComplete();
  }

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={submit}
    >
      <div className="flex flex-1 flex-col gap-2">
        <label htmlFor={`role-name-${id}`} className="text-sm font-medium">
          Role name for {initialName}
        </label>
        <Input
          id={`role-name-${id}`}
          aria-label={`Role name for ${initialName}`}
          required
          minLength={2}
          maxLength={160}
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Saving…" : "Save role name"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
