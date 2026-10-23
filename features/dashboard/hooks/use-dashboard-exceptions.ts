"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardExceptionsRefreshMs } from "../constants";
import { dashboardKeys } from "../query-keys";
import { getDashboardExceptionsAction } from "../services/dashboard-exceptions-actions";

export function useDashboardExceptions(branchId?: string) {
  return useQuery({
    queryKey: dashboardKeys.exceptions(branchId),
    queryFn: async () => {
      const response = await getDashboardExceptionsAction(branchId);
      if (!response.ok) throw new Error(response.error);
      return response.data;
    },
    staleTime: dashboardExceptionsRefreshMs,
    refetchInterval: dashboardExceptionsRefreshMs,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
