"use client";

import * as React from "react";

import { useLogin } from "@/features/auth/hooks/mutations/use-login";
import { authErrorMessages } from "@/features/auth/messages";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/auth.schema";
import { AuthApiError } from "@/features/auth/services/auth-client";

type LoginField = keyof LoginFormValues;
export type LoginFieldErrors = Partial<Record<LoginField, string>>;

// A short, decaying horizontal shake: the familiar "wrong password" cue.
const SHAKE_KEYFRAMES: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-6px)" },
  { transform: "translateX(5px)" },
  { transform: "translateX(-3px)" },
  { transform: "translateX(1px)" },
  { transform: "translateX(0)" },
];

function getServerMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof AuthApiError) {
    if (error.status === 429) {
      return authErrorMessages.tooManyAttempts(error.retryAfterSeconds ?? 60);
    }
    if (error.status === 401) return authErrorMessages.invalidCredentials;
    if (error.status >= 500) return authErrorMessages.serviceUnavailable;
  }
  return authErrorMessages.unexpected;
}

function shake(element: HTMLElement | null) {
  if (!element || typeof element.animate !== "function") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  element.animate(SHAKE_KEYFRAMES, {
    duration: 360,
    easing: "cubic-bezier(0.23, 1, 0.32, 1)",
  });
}

export function useLoginForm() {
  const loginMutation = useLogin();
  const [values, setValues] = React.useState<LoginFormValues>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = React.useState<LoginFieldErrors>({});
  const [heldServerMessage, setHeldServerMessage] = React.useState<
    string | null
  >(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const fieldsRef = React.useRef<HTMLDivElement>(null);

  // The mutation clears its error while a retry is pending. Holding the last
  // message keeps the layout steady instead of collapsing and re-expanding.
  const currentServerMessage = getServerMessage(loginMutation.error);
  if (currentServerMessage && currentServerMessage !== heldServerMessage) {
    setHeldServerMessage(currentServerMessage);
  }
  const serverMessage =
    currentServerMessage ??
    (loginMutation.isPending ? heldServerMessage : null);

  // Stay busy after success until the redirect replaces this page, so the
  // button never flashes back to its idle label.
  const isSubmitting = loginMutation.isPending || loginMutation.isSuccess;

  function updateValue(field: LoginField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const result = loginSchema.safeParse(values);
    if (!result.success) {
      const errors: LoginFieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if ((field === "email" || field === "password") && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      (errors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setFieldErrors({});
    loginMutation.mutate(result.data, {
      onError: (error) => {
        if (error instanceof AuthApiError && error.status === 401) {
          shake(fieldsRef.current);
          passwordRef.current?.focus();
          passwordRef.current?.select();
        }
      },
    });
  }

  return {
    values,
    fieldErrors,
    serverMessage,
    isServerMessageStale: serverMessage !== null && !currentServerMessage,
    isSubmitting,
    emailRef,
    passwordRef,
    fieldsRef,
    updateValue,
    handleSubmit,
  };
}
