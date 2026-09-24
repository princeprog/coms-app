"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateStaffAction } from "@/features/staff/services/staff-actions";
import type {
  StaffMember,
  StaffMutationResult,
} from "@/features/staff/types/staff.types";

export function StaffProfileForm({
  staff,
  branchId,
  onDirtyChange,
  onPendingChange,
}: {
  staff: StaffMember;
  branchId?: string;
  onDirtyChange?: (dirty: boolean) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(staff.email);
  const [fullName, setFullName] = useState(staff.full_name);
  const [contactNumber, setContactNumber] = useState(staff.contact_number);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  function reportDirty(next: {
    email?: string;
    fullName?: string;
    contactNumber?: string;
  }) {
    onDirtyChange?.(
      (next.email ?? email) !== staff.email ||
        (next.fullName ?? fullName) !== staff.full_name ||
        (next.contactNumber ?? contactNumber) !== staff.contact_number,
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setPending(true);
    onPendingChange?.(true);
    let result: StaffMutationResult;
    try {
      result = await updateStaffAction(staff.id, branchId, {
        email,
        full_name: fullName,
        contact_number: contactNumber,
      });
    } catch {
      setPending(false);
      onPendingChange?.(false);
      setError("COMS could not complete this change. Try again.");
      return;
    }
    setPending(false);
    onPendingChange?.(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEmail(email.trim().toLowerCase());
    setFullName(fullName.trim());
    setContactNumber(contactNumber.trim());
    onDirtyChange?.(false);
    setStatus("Staff profile updated.");
    router.refresh();
  }

  return (
    <details className="rounded-lg border p-4">
      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        Edit profile
      </summary>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
        <FieldGroup className="gap-4 sm:grid sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`staff-${staff.id}-full-name`}>
              Full name for {staff.full_name}
            </FieldLabel>
            <Input
              id={`staff-${staff.id}-full-name`}
              required
              minLength={2}
              maxLength={160}
              autoComplete="name"
              value={fullName}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setFullName(value);
                reportDirty({ fullName: value });
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`staff-${staff.id}-email`}>
              Email for {staff.full_name}
            </FieldLabel>
            <Input
              id={`staff-${staff.id}-email`}
              required
              type="email"
              maxLength={320}
              autoComplete="email"
              value={email}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setEmail(value);
                reportDirty({ email: value });
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`staff-${staff.id}-contact`}>
              Contact number for {staff.full_name}
            </FieldLabel>
            <Input
              id={`staff-${staff.id}-contact`}
              required
              type="tel"
              minLength={7}
              maxLength={30}
              autoComplete="tel"
              value={contactNumber}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setContactNumber(value);
                reportDirty({ contactNumber: value });
              }}
            />
          </Field>
        </FieldGroup>
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
