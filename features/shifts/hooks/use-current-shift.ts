"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { shiftKeys } from "../query-keys";
import { getCurrentShiftAction } from "../services/shift-actions";

export function useCurrentShift(branchId: string, enabled = true) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: shiftKeys.current(branchId),
    queryFn: async () => {
      const result = await getCurrentShiftAction(branchId);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled,
    retry: false,
    // Another cashier may open or a manager may force-close the shift.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  return {
    ...query,
    refresh: () => client.invalidateQueries({ queryKey: shiftKeys.all }),
  };
}
