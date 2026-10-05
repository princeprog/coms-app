"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function useDirectoryQuery<T extends { page: number; search?: string }>(
  filters: T,
  href: (filters: T) => string,
) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const queryKey = JSON.stringify(filters);
  const [draft, setDraft] = useState({
    key: queryKey,
    value: filters.search ?? "",
    issued: [] as string[],
    ownNavigation: false,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const desired = useRef(filters);
  const appliedHref = href(filters);
  const ownNavigation = draft.issued.includes(appliedHref);
  const search =
    draft.key === queryKey || ownNavigation
      ? draft.value
      : (filters.search ?? "");

  if (draft.key !== queryKey) {
    setDraft({
      key: queryKey,
      value: search,
      ownNavigation,
      issued: ownNavigation
        ? draft.issued.slice(draft.issued.lastIndexOf(appliedHref) + 1)
        : [],
    });
  }

  useEffect(() => {
    if (!draft.ownNavigation) {
      if (timer.current) clearTimeout(timer.current);
      desired.current = JSON.parse(queryKey) as T;
    }
  }, [queryKey, draft.ownNavigation]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function apply(change: Partial<T>) {
    if (timer.current) clearTimeout(timer.current);
    desired.current = { ...desired.current, ...change, page: 1 };
    const nextHref = href(desired.current);
    if (nextHref === appliedHref) return;
    setDraft((current) => ({
      ...current,
      issued: [...current.issued.slice(-9), nextHref],
    }));
    startTransition(() => router.replace(nextHref, { scroll: false }));
  }

  function changeSearch(value: string) {
    setDraft((current) => ({ ...current, key: queryKey, value }));
    desired.current = { ...desired.current, search: value.trim() };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => apply({ search: value.trim() } as Partial<T>),
      350,
    );
  }

  return {
    search,
    pending,
    apply,
    changeSearch,
    flushSearch: () => apply({ search: search.trim() } as Partial<T>),
  };
}
