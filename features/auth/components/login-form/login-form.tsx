"use client";

import { ArrowRight, CircleAlert, Mail } from "lucide-react";
import { cn } from "cn";

import { PasswordField } from "@/features/auth/components/login-form/password-field";
import { useLoginForm } from "@/features/auth/components/login-form/use-login-form";
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

const revealClassName =
  "animate-in duration-200 ease-out-quint fade-in-0 motion-safe:slide-in-from-top-1";

export function LoginForm() {
  const {
    values,
    fieldErrors,
    serverMessage,
    isServerMessageStale,
    isSubmitting,
    emailRef,
    passwordRef,
    fieldsRef,
    updateValue,
    handleSubmit,
  } = useLoginForm();
  const emailError = fieldErrors.email;

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <FieldGroup ref={fieldsRef} className="gap-4">
        <Field data-invalid={Boolean(emailError)}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <InputGroup className="h-11 rounded-lg">
            <InputGroupAddon>
              <Mail aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              ref={emailRef}
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
              autoFocus
              placeholder="name@example.com"
              value={values.email}
              onChange={(event) => updateValue("email", event.target.value)}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "email-error" : undefined}
            />
          </InputGroup>
          {emailError ? (
            <FieldError
              id="email-error"
              role={undefined}
              className={revealClassName}
            >
              {emailError}
            </FieldError>
          ) : null}
        </Field>

        <PasswordField
          value={values.password}
          error={fieldErrors.password}
          inputRef={passwordRef}
          onValueChange={(value) => updateValue("password", value)}
        />
      </FieldGroup>

      {serverMessage ? (
        <div
          role="alert"
          data-stale={isServerMessageStale}
          className={cn(
            "flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive transition-opacity duration-200 data-[stale=true]:opacity-60",
            revealClassName,
          )}
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{serverMessage}</p>
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full rounded-lg transition-[background-color,scale,translate] duration-150 ease-out active:scale-97 disabled:opacity-100"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Spinner data-icon="inline-start" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          <>
            Sign In
            <ArrowRight
              data-icon="inline-end"
              aria-hidden="true"
              className="transition-transform duration-200 ease-out-quint group-hover/button:translate-x-0.5"
            />
          </>
        )}
      </Button>
    </form>
  );
}
