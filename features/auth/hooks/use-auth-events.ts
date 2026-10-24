"use client";

import { startTransition, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  subscribeToLogout,
  subscribeToSessionRecovery,
} from "@/features/auth/services/auth-coordination";
import { authKeys } from "@/features/auth/query-keys";

export function useAuthEvents() {
  const client = useQueryClient();
  const router = useRouter();
  useEffect(
    () =>
      subscribeToSessionRecovery(() => {
        // Only retry reads. Never replay a sale or another mutation after recovery.
        void client.invalidateQueries({
          predicate: (query) => query.queryKey[0] !== authKeys.me[0],
        });
        startTransition(() => router.refresh());
      }),
    [client, router],
  );
  useEffect(
    () =>
      subscribeToLogout(() => {
        void client.cancelQueries().then(() => {
          client.clear();
          router.replace("/");
          router.refresh();
        });
      }),
    [client, router],
  );
}
