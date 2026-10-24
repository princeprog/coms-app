"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authKeys } from "@/features/auth/query-keys";
import type { User } from "@/features/auth/types/auth.types";
import { useCurrentUser } from "@/features/auth/hooks/queries/use-current-user";

export function AuthQuerySeed({ user }: { user: User }) {
  useCurrentUser();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    queryClient.setQueryData(authKeys.me, user);
  }, [queryClient, user]);

  return null;
}
