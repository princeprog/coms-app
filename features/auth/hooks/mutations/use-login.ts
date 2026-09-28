"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { login } from "@/features/auth/services/auth-client";
import type { LoginInput } from "@/features/auth/types/auth.types";

export function useLogin() {
  const router = useRouter();
  return useMutation({
    retry: false,
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: () => router.replace("/"),
  });
}
