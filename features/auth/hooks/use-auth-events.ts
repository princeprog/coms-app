"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { subscribeToLogout } from "@/features/auth/services/auth-coordination";

export function useAuthEvents() {
  const client = useQueryClient();
  const router = useRouter();
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
