"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBranchAction } from "@/features/branches/services/branch-actions";
import type {
  Branch,
  BranchMutationResult,
} from "@/features/branches/types/branch.types";

function dateInputValue(value: string | null) {
  return value?.slice(0, 10) ?? "";
}

export function BranchEditorForm({
  branch,
  onComplete,
}: {
  branch: Branch;
  onComplete: () => void;
}) {
  const [branchName, setBranchName] = useState(branch.branch_name);
  const [address, setAddress] = useState(branch.address ?? "");
  const [dateOpened, setDateOpened] = useState(
    dateInputValue(branch.date_opened),
  );
  const [hasDineIn, setHasDineIn] = useState(branch.has_dine_in);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    let result: BranchMutationResult;
    try {
      result = await updateBranchAction(branch.id, {
        branch_name: branchName,
        address: address.trim() || null,
        date_opened: dateOpened || null,
        has_dine_in: hasDineIn,
      });
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
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor={`branch-name-${branch.id}`}
            className="text-sm font-medium"
          >
            Branch name for {branch.branch_name}
          </label>
          <Input
            id={`branch-name-${branch.id}`}
            aria-label={`Branch name for ${branch.branch_name}`}
            required
            minLength={2}
            maxLength={160}
            value={branchName}
            onChange={(event) => setBranchName(event.currentTarget.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={`branch-address-${branch.id}`}
            className="text-sm font-medium"
          >
            Address
          </label>
          <Input
            id={`branch-address-${branch.id}`}
            maxLength={1000}
            value={address}
            onChange={(event) => setAddress(event.currentTarget.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={`branch-date-opened-${branch.id}`}
            className="text-sm font-medium"
          >
            Date opened
          </label>
          <Input
            id={`branch-date-opened-${branch.id}`}
            type="date"
            value={dateOpened}
            onChange={(event) => setDateOpened(event.currentTarget.value)}
          />
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm focus-within:ring-2 focus-within:ring-ring">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            aria-label={`Dine-in seating at ${branch.branch_name}`}
            checked={hasDineIn}
            onChange={(event) => setHasDineIn(event.currentTarget.checked)}
          />
          Dine-in seating
        </label>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving branch…" : "Save branch details"}
        </Button>
      </div>
    </form>
  );
}
