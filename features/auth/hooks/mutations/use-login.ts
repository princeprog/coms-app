"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authKeys } from "@/features/auth/query-keys";
import { getAuthorizedLandingPath } from "@/features/auth/permissions";
import { login } from "@/features/auth/services/auth-client";
import type { LoginInput } from "@/features/auth/types/auth.types";

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    retry: false,
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(authKeys.me, user);
      router.push(getAuthorizedLandingPath(user));
      router.refresh();
    },
  });
}
