"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBranchAction } from "@/features/branches/services/branch-actions";
import type { BranchMutationResult } from "@/features/branches/types/branch.types";

export function BranchCreateForm({ onComplete }: { onComplete: () => void }) {
  const [code, setCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [dateOpened, setDateOpened] = useState("");
  const [hasDineIn, setHasDineIn] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setPending(true);
    let result: BranchMutationResult;
    try {
      result = await createBranchAction({
        code,
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
    setCode("");
    setBranchName("");
    setAddress("");
    setDateOpened("");
    setHasDineIn(false);
    setStatus("Branch created.");
    onComplete();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a branch</CardTitle>
        <p className="text-sm text-muted-foreground">
          Add a location and set its basic operating details.
        </p>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="branch-code" className="text-sm font-medium">
                Branch code
              </label>
              <Input
                id="branch-code"
                required
                minLength={2}
                maxLength={50}
                pattern="[A-Z0-9][A-Z0-9_-]{1,49}"
                value={code}
                onChange={(event) =>
                  setCode(event.currentTarget.value.toUpperCase())
                }
                placeholder="MANILA_02"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="branch-name" className="text-sm font-medium">
                Branch name
              </label>
              <Input
                id="branch-name"
                required
                minLength={2}
                maxLength={160}
                value={branchName}
                onChange={(event) => setBranchName(event.currentTarget.value)}
                placeholder="Manila South"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="branch-address" className="text-sm font-medium">
                Address
              </label>
              <Input
                id="branch-address"
                maxLength={1000}
                value={address}
                onChange={(event) => setAddress(event.currentTarget.value)}
                placeholder="Street, city"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="branch-date-opened"
                className="text-sm font-medium"
              >
                Date opened
              </label>
              <Input
                id="branch-date-opened"
                type="date"
                value={dateOpened}
                onChange={(event) => setDateOpened(event.currentTarget.value)}
              />
            </div>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm focus-within:ring-2 focus-within:ring-ring">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              aria-label="Has dine-in seating"
              checked={hasDineIn}
              onChange={(event) => setHasDineIn(event.currentTarget.checked)}
            />
            Has dine-in seating
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {status && (
            <p role="status" className="text-sm text-muted-foreground">
              {status}
            </p>
          )}
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating branch…" : "Create branch"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
