"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authKeys } from "@/features/auth/query-keys";
import { refreshSession } from "@/features/auth/services/auth-client";

export function useRefreshSession() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: refreshSession,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(authKeys.me, user);
      router.refresh();
    },
  });
}
