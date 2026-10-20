"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { shiftKeys } from "../query-keys";
import { shiftQuerySchema, type ShiftQuery } from "../schemas/shift.schema";
import { listShiftsAction } from "../services/shift-actions";

export function useShiftDirectory(branchId: string) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const query = shiftQuerySchema.parse(Object.fromEntries(params));
  const [navigating, startTransition] = useTransition();
  function update(
    patch: Partial<ShiftQuery> & { branch?: string },
    resetPage = true,
  ) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === "" || value === undefined) next.delete(key);
      else next.set(key, String(value));
    }
    if (resetPage) next.set("page", "1");
    startTransition(() => router.replace(`${path}?${next}`, { scroll: false }));
  }
  const result = useQuery({
    queryKey: shiftKeys.list(branchId, query),
    queryFn: async () => {
      const response = await listShiftsAction(branchId, query);
      if (!response.ok) throw new Error(response.error);
      return response.data;
    },
    retry: false,
  });
  return {
    query,
    update,
    result,
    loading: result.isFetching || navigating,
    /** Skeletons replace rows only before the first page of a query arrives. */
    showSkeleton: result.isPending || navigating,
    hasFilters: Boolean(query.status || query.date_from || query.date_to),
  };
}
