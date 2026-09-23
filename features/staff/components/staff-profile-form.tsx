"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateStaffAction } from "@/features/staff/services/staff-actions";
import type {
  StaffMember,
  StaffMutationResult,
} from "@/features/staff/types/staff.types";

export function StaffProfileForm({
  staff,
  branchId,
}: {
  staff: StaffMember;
  branchId?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(staff.email);
  const [fullName, setFullName] = useState(staff.full_name);
  const [contactNumber, setContactNumber] = useState(staff.contact_number);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setPending(true);
    let result: StaffMutationResult;
    try {
      result = await updateStaffAction(staff.id, branchId, {
        email,
        full_name: fullName,
        contact_number: contactNumber,
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
    setEmail(email.trim().toLowerCase());
    setFullName(fullName.trim());
    setContactNumber(contactNumber.trim());
    setStatus("Staff profile updated.");
    router.refresh();
  }

  return (
    <details className="rounded-xl border p-4">
      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        Edit profile
      </summary>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Full name for {staff.full_name}
            <Input
              required
              minLength={2}
              maxLength={160}
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.currentTarget.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Email for {staff.full_name}
            <Input
              required
              type="email"
              maxLength={320}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Contact number for {staff.full_name}
            <Input
              required
              type="tel"
              minLength={7}
              maxLength={30}
              autoComplete="tel"
              value={contactNumber}
              onChange={(event) => setContactNumber(event.currentTarget.value)}
            />
          </label>
        </div>
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
            {pending ? "Saving profile…" : "Save profile"}
          </Button>
        </div>
      </form>
    </details>
  );
}
