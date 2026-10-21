"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { auditQuerySchema, type AuditQuery } from "../schemas/audit.schema";

type Patch = Partial<Record<keyof AuditQuery, string | number | undefined>>;

// Filters and pagination live in the URL so a filtered log can be shared.
export function useAuditQuery() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const query = auditQuerySchema.parse(Object.fromEntries(params));
  const [navigating, startTransition] = useTransition();
  function href(patch: Patch) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === "" || value === undefined) next.delete(key);
      else next.set(key, String(value));
    }
    if (!("page" in patch)) next.delete("page");
    const search = next.toString();
    return search ? `${path}?${search}` : path;
  }
  function update(patch: Patch) {
    startTransition(() => router.replace(href(patch), { scroll: false }));
  }
  return { query, href, update, navigating };
}

export type AuditQueryState = ReturnType<typeof useAuditQuery>;
