"use client";
import { startTransition, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { ApiRequestError } from "@/services/api-services";
import { sendCountReminderAction } from "../services/count-reminder-action";
import type { CountReminder } from "../types/count-reminder.types";

export function useCountReminder(
  id: string,
  branchName: string,
  metadata: CountReminder,
) {
  const router = useRouter();
  const retryKey = useRef<string | null>(null);
  const inFlight = useRef(false);
  const [limitedUntil, setLimitedUntil] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const mutation = useMutation({
    mutationKey: ["dispatch-count-reminder", id],
    retry: false,
    mutationFn: async () => {
      retryKey.current ??= crypto.randomUUID();
      const result = await sendCountReminderAction(id, retryKey.current);
      if (!result.ok) {
        if (result.next_allowed_at) setLimitedUntil(result.next_allowed_at);
        if (result.status < 500) retryKey.current = null;
        throw new ApiRequestError(result.error, result.status);
      }
      return result.data;
    },
    onSuccess: () => {
      retryKey.current = null;
      toast.add({
        type: "success",
        title: `Count reminder sent to ${branchName}.`,
      });
      startTransition(() => router.refresh());
    },
    onError: (error) => {
      toast.add({ type: "error", title: error.message });
      if (
        error instanceof ApiRequestError &&
        [404, 409, 429].includes(error.status)
      )
        startTransition(() => router.refresh());
    },
    onSettled: () => {
      inFlight.current = false;
    },
  });
  const nextAllowed = [
    metadata.next_allowed_at,
    mutation.data?.next_allowed_at,
    limitedUntil,
  ]
    .filter((v): v is string => !!v)
    .sort()
    .at(-1);
  const lastSent = [metadata.last_sent_at, mutation.data?.last_sent_at]
    .filter((v): v is string => !!v)
    .sort()
    .at(-1);
  const remaining = nextAllowed ? Date.parse(nextAllowed) - now : 0;
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(remaining + 50, 30_000),
    );
    return () => window.clearTimeout(timer);
  }, [remaining, now]);
  return {
    pending: mutation.isPending,
    coolingDown: remaining > 0,
    nextAllowed,
    lastSent,
    send: () => {
      if (inFlight.current || remaining > 0) return;
      inFlight.current = true;
      mutation.mutate();
    },
  };
}
