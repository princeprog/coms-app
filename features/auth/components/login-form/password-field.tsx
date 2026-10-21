"use client";

import * as React from "react";
import { ArrowBigUp, Eye, EyeOff, LockKeyhole } from "lucide-react";

import { authErrorMessages } from "@/features/auth/messages";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

const iconSwapClassName =
  "animate-in fade-in-0 blur-in-2 duration-200 ease-out-quint motion-safe:zoom-in-75";

type PasswordFieldProps = {
  value: string;
  error?: string;
  inputRef: React.Ref<HTMLInputElement>;
  onValueChange: (value: string) => void;
};

export function PasswordField({
  value,
  error,
  inputRef,
  onValueChange,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [capsLockOn, setCapsLockOn] = React.useState(false);
  const errorId = "password-error";
  const capsLockId = "password-caps-lock";
  const describedBy =
    [error ? errorId : null, capsLockOn ? capsLockId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  function syncCapsLock(event: React.KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState("CapsLock"));
  }

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="password">Password</FieldLabel>
      <InputGroup className="h-11 rounded-lg">
        <InputGroupAddon>
          <LockKeyhole aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          id="password"
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          enterKeyHint="go"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={syncCapsLock}
          onKeyUp={syncCapsLock}
          onBlur={() => setCapsLockOn(false)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground transition-[background-color,color,scale] duration-150 ease-out hover:text-foreground active:scale-95"
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((visible) => !visible)}
        >
          {showPassword ? (
            <EyeOff
              key="hide"
              aria-hidden="true"
              className={iconSwapClassName}
            />
          ) : (
            <Eye key="show" aria-hidden="true" className={iconSwapClassName} />
          )}
        </InputGroupButton>
      </InputGroup>
      <div aria-live="polite" className="empty:hidden">
        {capsLockOn ? (
          <FieldDescription
            id={capsLockId}
            className="flex animate-in items-center gap-1.5 duration-200 ease-out-quint fade-in-0 motion-safe:slide-in-from-top-1"
          >
            <ArrowBigUp className="size-4" aria-hidden="true" />
            {authErrorMessages.capsLockOn}
          </FieldDescription>
        ) : null}
      </div>
      {error ? (
        <FieldError
          id={errorId}
          role={undefined}
          className="animate-in duration-200 ease-out-quint fade-in-0 motion-safe:slide-in-from-top-1"
        >
          {error}
        </FieldError>
      ) : null}
    </Field>
  );
}
