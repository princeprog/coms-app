"use client";
import { useEffect, useRef, useState } from "react";

/** A matching retry keeps its key; a deliberately changed payload starts a new operation. */
export function operationKey(
  previous: { payload: string; key: string } | null,
  payload: unknown,
  createKey = () => crypto.randomUUID(),
) {
  const serialized = JSON.stringify(payload);
  return previous?.payload === serialized
    ? previous
    : { payload: serialized, key: createKey() };
}
export function useExpenseRetryKey() {
  const attempt = useRef<{ payload: string; key: string } | null>(null);
  return (payload: unknown) => {
    attempt.current = operationKey(attempt.current, payload);
    return attempt.current.key;
  };
}
export function useExpenseDraft(
  dirty: boolean,
  pending: boolean,
  onClose: () => void,
) {
  const [discard, setDiscard] = useState(false);
  useEffect(() => {
    if (!dirty && !pending) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, pending]);
  return {
    discard,
    setDiscard,
    close: () => {
      if (pending) return;
      if (dirty) setDiscard(true);
      else onClose();
    },
  };
}
