"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authKeys } from "@/features/auth/query-keys";
import { refreshSession } from "@/features/auth/services/auth-client";
import { ApiRequestError } from "@/services/api-services";

export function useRefreshSession() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    retry: false,
    mutationFn: refreshSession,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(authKeys.me, user);
      router.refresh();
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
