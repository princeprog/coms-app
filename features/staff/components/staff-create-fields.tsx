"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type {
  StaffCreateField,
  StaffCreateFieldErrors,
} from "./staff-create-validation";
import { sanitizeStaffContactInput } from "./staff-create-validation";

export type StaffCreateValues = Record<StaffCreateField, string>;

function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-1 text-destructive">
      *
    </span>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

export function StaffCreateFields({
  values,
  errors,
  pending,
  onChange,
  onBlur,
}: {
  values: StaffCreateValues;
  errors: StaffCreateFieldErrors;
  pending: boolean;
  onChange: (field: StaffCreateField, value: string) => void;
  onBlur: (field: StaffCreateField) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <section aria-labelledby="staff-account-details" className="space-y-4">
      <h3
        id="staff-account-details"
        className="border-b pb-2 text-base font-semibold"
      >
        Account details
      </h3>
      <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
        <Field className="gap-2">
          <FieldLabel htmlFor="staff-create-full-name">
            Full name
            <RequiredMark />
          </FieldLabel>
          <Input
            id="staff-create-full-name"
            aria-label="Full name"
            className="h-11"
            autoComplete="name"
            placeholder="Enter full name"
            maxLength={160}
            value={values.fullName}
            disabled={pending}
            aria-required="true"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={
              errors.fullName ? "staff-create-full-name-error" : undefined
            }
            onChange={(event) =>
              onChange("fullName", event.currentTarget.value)
            }
            onBlur={() => onBlur("fullName")}
          />
          <FieldError
            id="staff-create-full-name-error"
            message={errors.fullName}
          />
        </Field>

        <Field className="gap-2">
          <FieldLabel htmlFor="staff-create-email">
            Email
            <RequiredMark />
          </FieldLabel>
          <Input
            id="staff-create-email"
            aria-label="Email"
            type="email"
            className="h-11"
            autoComplete="email"
            placeholder="name@example.com"
            maxLength={320}
            value={values.email}
            disabled={pending}
            aria-required="true"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email ? "staff-create-email-error" : undefined
            }
            onChange={(event) => onChange("email", event.currentTarget.value)}
            onBlur={() => onBlur("email")}
          />
          <FieldError id="staff-create-email-error" message={errors.email} />
        </Field>

        <Field className="gap-2">
          <FieldLabel htmlFor="staff-create-contact">
            Contact number
            <RequiredMark />
          </FieldLabel>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
            >
              +63
            </span>
            <Input
              id="staff-create-contact"
              aria-label="Contact number"
              type="tel"
              inputMode="numeric"
              className="h-11 pl-12"
              autoComplete="tel-national"
              placeholder="912 345 6789"
              maxLength={30}
              value={values.contactNumber}
              disabled={pending}
              aria-required="true"
              aria-invalid={Boolean(errors.contactNumber)}
              aria-describedby={`staff-create-contact-hint${errors.contactNumber ? " staff-create-contact-error" : ""}`}
              onChange={(event) =>
                onChange(
                  "contactNumber",
                  sanitizeStaffContactInput(
                    event.currentTarget.value,
                    values.contactNumber,
                  ),
                )
              }
              onBlur={() => onBlur("contactNumber")}
            />
          </div>
          <FieldDescription id="staff-create-contact-hint">
            Philippine mobile number: 10 digits after +63. You can paste an 089,
            09, or +63 number.
          </FieldDescription>
          <FieldError
            id="staff-create-contact-error"
            message={errors.contactNumber}
          />
        </Field>

        <Field className="gap-2">
          <FieldLabel htmlFor="staff-create-password">
            Initial password
            <RequiredMark />
          </FieldLabel>
          <div className="relative">
            <Input
              id="staff-create-password"
              aria-label="Initial password"
              type={showPassword ? "text" : "password"}
              className="h-11 pr-11"
              autoComplete="new-password"
              placeholder="Enter initial password"
              maxLength={128}
              value={values.password}
              disabled={pending}
              aria-required="true"
              aria-invalid={Boolean(errors.password)}
              aria-describedby="staff-create-password-hint staff-create-password-error"
              onChange={(event) =>
                onChange("password", event.currentTarget.value)
              }
              onBlur={() => onBlur("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={pending}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
          <FieldDescription id="staff-create-password-hint">
            Use at least 12 characters. The password is never shown again after
            creation.
          </FieldDescription>
          <FieldError
            id="staff-create-password-error"
            message={errors.password}
          />
        </Field>
      </div>
    </section>
  );
}
