"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { LockKeyhole } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { changePasswordAction } from "../services/auth-actions";

type Errors = Partial<Record<"current" | "next" | "confirm", string>>;

function validate(current: string, next: string, confirm: string): Errors {
  const errors: Errors = {};
  if (!current) errors.current = "Enter your current password.";
  if (next.length < 12 || next.length > 128)
    errors.next = "Use 12 to 128 characters.";
  else if (next === current)
    errors.next = "Choose a password different from the current one.";
  if (confirm !== next) errors.confirm = "The passwords don't match.";
  return errors;
}

export function ChangePasswordForm({ required }: { required: boolean }) {
  const router = useRouter();
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const mutation = useMutation({
    mutationFn: async () => {
      const result = await changePasswordAction({
        current_password: values.current,
        new_password: values.next,
      });
      if (!result.ok) throw new Error(result.message);
    },
    onSuccess: () => {
      toast.add({
        type: "success",
        title: "Password changed. Other devices have been signed out.",
      });
      router.replace("/");
      router.refresh();
    },
  });
  const fields = [
    {
      key: "current" as const,
      label: required ? "Temporary password" : "Current password",
      autoComplete: "current-password",
    },
    {
      key: "next" as const,
      label: "New password",
      autoComplete: "new-password",
    },
    {
      key: "confirm" as const,
      label: "Confirm new password",
      autoComplete: "new-password",
    },
  ];
  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (mutation.isPending) return;
        const found = validate(values.current, values.next, values.confirm);
        setErrors(found);
        const first = Object.keys(found)[0];
        if (first) {
          document.getElementById(`password-${first}`)?.focus();
          return;
        }
        mutation.mutate();
      }}
    >
      <FieldGroup className="gap-4">
        {fields.map((field) => (
          <Field key={field.key} data-invalid={Boolean(errors[field.key])}>
            <FieldLabel htmlFor={`password-${field.key}`}>
              {field.label}
            </FieldLabel>
            <InputGroup className="h-11">
              <InputGroupAddon>
                <LockKeyhole aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                id={`password-${field.key}`}
                type="password"
                autoComplete={field.autoComplete}
                autoFocus={field.key === "current"}
                value={values[field.key]}
                onChange={(event) => {
                  setValues((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }));
                  setErrors((current) => ({
                    ...current,
                    [field.key]: undefined,
                  }));
                }}
                aria-invalid={Boolean(errors[field.key])}
                aria-describedby={
                  errors[field.key] ? `password-${field.key}-error` : undefined
                }
              />
            </InputGroup>
            {errors[field.key] && (
              <FieldError id={`password-${field.key}-error`} role={undefined}>
                {errors[field.key]}
              </FieldError>
            )}
          </Field>
        ))}
      </FieldGroup>
      {mutation.error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          {mutation.error.message}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="h-11 w-full transition-[background-color,scale] duration-150 ease-out active:scale-97 disabled:opacity-100"
        disabled={mutation.isPending}
      >
        {mutation.isPending && (
          <Spinner data-icon="inline-start" aria-hidden="true" />
        )}
        {mutation.isPending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
