"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { authKeys } from "@/features/auth/query-keys";
import { getCurrentUser } from "@/features/auth/services/auth-client";
import { ApiRequestError } from "@/services/api-services";
import type { User } from "@/features/auth/types/auth.types";

export function useCurrentUser() {
  const router = useRouter();
  const query = useQuery<User | null, ApiRequestError>({
    queryKey: authKeys.me,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 60_000,
  });
  useEffect(() => {
    if (query.isSuccess && query.data === null) {
      router.replace("/");
      router.refresh();
    } else if (query.error?.status === 428) {
      // The server page renders the sign-in-again recovery action.
      router.refresh();
    }
  }, [query.data, query.isSuccess, query.error, router]);
  return query;
}
