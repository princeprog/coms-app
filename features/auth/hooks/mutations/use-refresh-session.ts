"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authKeys } from "@/features/auth/query-keys";
import { refreshSession } from "@/features/auth/services/auth-client";
import { ApiRequestError } from "@/services/api-services";
import { startTransition } from "react";

export function useRefreshSession(onRecovered?: () => void) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    retry: false,
    mutationFn: refreshSession,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(authKeys.me, user);
      startTransition(() => {
        router.refresh();
        onRecovered?.();
      });
    },
    onError: async (error) => {
      if (error instanceof ApiRequestError && error.status === 401) {
        await queryClient.cancelQueries();
        queryClient.clear();
        router.replace("/");
        router.refresh();
      }
    },
  });
}
