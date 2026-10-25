"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { StaffEditFormFooter } from "./staff-edit-form-footer";
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
  onComplete,
  onCancel,
}: {
  staff: StaffMember;
  branchId?: string;
  onDirtyChange?: (dirty: boolean) => void;
  onPendingChange?: (pending: boolean) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(staff.email);
  const [fullName, setFullName] = useState(staff.full_name);
  const [contactNumber, setContactNumber] = useState(staff.contact_number);
  const [error, setError] = useState("");
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
    if (pending) return;
    setError("");
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
    toast.add({ type: "success", title: "Staff profile updated." });
    router.refresh();
    onComplete?.();
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-col">
      <div className="min-h-0 space-y-5 overflow-y-auto px-5 pb-6 sm:px-8 [&_input]:h-10 [&_[data-slot=select-trigger]]:h-10">
        <FieldGroup className="gap-4 sm:grid sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`staff-${staff.id}-full-name`}>
              Full name<span className="sr-only"> for {staff.full_name}</span>
            </FieldLabel>
            <Input
              id={`staff-${staff.id}-full-name`}
              disabled={pending}
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
              Email<span className="sr-only"> for {staff.full_name}</span>
            </FieldLabel>
            <Input
              id={`staff-${staff.id}-email`}
              disabled={pending}
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
              Contact number
              <span className="sr-only"> for {staff.full_name}</span>
            </FieldLabel>
            <Input
              id={`staff-${staff.id}-contact`}
              disabled={pending}
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
      </div>
      <StaffEditFormFooter
        pending={pending}
        onCancel={onCancel}
        label="Save profile"
        pendingLabel="Saving profile…"
      />
    </form>
  );
}
