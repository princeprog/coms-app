"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authKeys } from "@/features/auth/query-keys";
import { logout } from "@/features/auth/services/auth-client";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.all });
      router.replace("/");
      router.refresh();
    },
  });
}
