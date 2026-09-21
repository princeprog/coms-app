"use client";

import { useQuery } from "@tanstack/react-query";

import { authKeys } from "@/features/auth/query-keys";
import { getCurrentUser } from "@/features/auth/services/auth-client";
import { ApiRequestError } from "@/services/api-services";
import type { User } from "@/features/auth/types/auth.types";

export function useCurrentUser() {
  return useQuery<User | null, ApiRequestError>({
    queryKey: authKeys.me,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 60_000,
  });
}
