"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { z } from "zod";
import { dashboardRefreshMs } from "../constants";
import { dashboardKeys } from "../query-keys";
import { getDashboardTodayAction } from "../services/dashboard-today-actions";

// The branch filter lives in the URL; data refreshes every minute while visible.
export function useDashboardToday() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const parsed = z.uuid().safeParse(params.get("branch"));
  const branchId = parsed.success ? parsed.data : undefined;
  const [navigating, startTransition] = useTransition();
  const result = useQuery({
    queryKey: dashboardKeys.today(branchId),
    queryFn: async () => {
      const response = await getDashboardTodayAction(branchId);
      if (!response.ok) throw new Error(response.error);
      return response.data;
    },
    refetchInterval: dashboardRefreshMs,
    refetchIntervalInBackground: false,
    placeholderData: (previous) => previous,
    retry: false,
  });
  function selectBranch(next?: string) {
    const search = new URLSearchParams(params);
    if (next) search.set("branch", next);
    else search.delete("branch");
    const query = search.toString();
    startTransition(() =>
      router.replace(query ? `${path}?${query}` : path, { scroll: false }),
    );
  }
  return { result, branchId, selectBranch, navigating };
}
