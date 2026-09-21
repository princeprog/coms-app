"use client";

import * as React from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { authErrorMessages } from "@/features/auth/messages";
import { useLogin } from "@/features/auth/hooks/mutations/use-login";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/auth.schema";
import { AuthApiError } from "@/features/auth/services/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [values, setValues] = React.useState<LoginFormValues>({
    email: "",
    password: "",
  });
  const [validationMessage, setValidationMessage] = React.useState<
    string | null
  >(null);
  const loginMutation = useLogin();

  const serverMessage = loginMutation.error
    ? loginMutation.error instanceof AuthApiError &&
      loginMutation.error.status === 401
      ? authErrorMessages.invalidCredentials
      : loginMutation.error instanceof AuthApiError &&
          loginMutation.error.status === 503
        ? authErrorMessages.serviceUnavailable
        : authErrorMessages.unexpected
    : null;
  const errorMessage = validationMessage ?? serverMessage;

  function updateValue(field: keyof LoginFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setValidationMessage(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      setValidationMessage(
        result.error.issues[0]?.message ?? "Check your email and password.",
      );
      return;
    }

    loginMutation.mutate(result.data);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor="email" className="sr-only">
            Email
          </FieldLabel>
          <InputGroup className="h-11">
            <InputGroupAddon>
              <Mail aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Email"
              aria-label="Email"
              value={values.email}
              onChange={(event) => updateValue("email", event.target.value)}
              aria-invalid={Boolean(errorMessage)}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="password" className="sr-only">
            Password
          </FieldLabel>
          <InputGroup className="h-11">
            <InputGroupAddon>
              <LockKeyhole aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="Password"
              aria-label="Password"
              value={values.password}
              onChange={(event) => updateValue("password", event.target.value)}
              aria-invalid={Boolean(errorMessage)}
            />
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" />
              ) : (
                <Eye aria-hidden="true" />
              )}
            </InputGroupButton>
          </InputGroup>
        </Field>
      </FieldGroup>

      {errorMessage ? (
        <p
          role="alert"
          aria-live="assertive"
          className="text-sm text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Signing in…" : "Sign In"}
        <ArrowRight data-icon="inline-end" aria-hidden="true" />
      </Button>
    </form>
  );
}
