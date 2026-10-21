"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  salesReportQuerySchema,
  type SalesReportQuery,
} from "../schemas/sales-report.schema";

type Patch = Partial<Record<keyof SalesReportQuery, string | undefined>>;

// Period, date and branch live in the URL so a report view can be shared.
export function useSalesReportQuery() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const query = salesReportQuerySchema.parse(Object.fromEntries(params));
  const [navigating, startTransition] = useTransition();
  function update(patch: Patch) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const search = next.toString();
    startTransition(() =>
      router.replace(search ? `${path}?${search}` : path, { scroll: false }),
    );
  }
  return { query, update, navigating };
}

export type SalesReportQueryState = ReturnType<typeof useSalesReportQuery>;
