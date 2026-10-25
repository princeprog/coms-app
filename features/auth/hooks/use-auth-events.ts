"use client";

import { startTransition, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  subscribeToLogout,
  subscribeToSessionRecovery,
} from "@/features/auth/services/auth-coordination";
import { authKeys } from "@/features/auth/query-keys";
import { lockOfflineRegister } from "@/features/pos-offline/hooks/offline-lock";

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
        if (window.location.pathname !== "/offline-pos") startTransition(() => router.refresh());
      }),
    [client, router],
  );
  useEffect(
    () =>
      subscribeToLogout(() => {
        void Promise.all([client.cancelQueries(), lockOfflineRegister()]).then(() => {
          client.clear();
          if (window.location.pathname === "/offline-pos") return;
          router.replace("/");
          router.refresh();
        });
      }),
    [client, router],
  );
}
