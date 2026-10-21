"use client";

import { useQuery } from "@tanstack/react-query";
import { getRestockSuggestions } from "../services/dispatch-restock-actions";

export function useRestockSuggestions(branchId: string) {
  return useQuery({
    queryKey: ["dispatch-restock-suggestions", branchId],
    queryFn: () => getRestockSuggestions(branchId),
    enabled: Boolean(branchId),
    retry: false,
    staleTime: 30_000,
  });
}
