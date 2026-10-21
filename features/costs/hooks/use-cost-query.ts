"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { costQuerySchema, type CostQuery } from "../schemas/cost.schema";

type Patch = Partial<Record<keyof CostQuery, string | number | undefined>>;

// Filters, tabs and pagination live in the URL so views are shareable.
export function useCostQuery() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const query = costQuerySchema.parse(Object.fromEntries(params));
  const [navigating, startTransition] = useTransition();
  function href(patch: Patch, resetPage = true) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === "" || value === undefined) next.delete(key);
      else next.set(key, String(value));
    }
    if (resetPage && !("page" in patch)) next.delete("page");
    const search = next.toString();
    return search ? `${path}?${search}` : path;
  }
  function update(patch: Patch, resetPage = true) {
    startTransition(() =>
      router.replace(href(patch, resetPage), { scroll: false }),
    );
  }
  return { query, href, update, navigating };
}
