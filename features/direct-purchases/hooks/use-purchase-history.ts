"use client";
import { purchaseKeys } from "../query-keys";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  purchaseQuerySchema,
  type PurchaseQuery,
} from "../schemas/purchase.schema";
import {
  getPurchasePage,
  getPurchaseDetail,
} from "../services/purchase-actions";
export function usePurchaseHistory() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const query = purchaseQuerySchema.parse(Object.fromEntries(params));
  const [navigating, startTransition] = useTransition();
  const [draft, setDraft] = useState({
    applied: query.search,
    value: query.search,
  });
  if (draft.applied !== query.search)
    setDraft({ applied: query.search, value: query.search });
  function update(patch: Partial<PurchaseQuery>, resetPage = true) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === "") next.delete(key);
      else next.set(key, String(value));
    }
    if (resetPage) next.set("page", "1");
    startTransition(() => router.replace(`${path}?${next}`, { scroll: false }));
  }
  useEffect(() => {
    if (draft.value === query.search) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      next.set("search", draft.value);
      next.set("page", "1");
      startTransition(() =>
        router.replace(`${path}?${next}`, { scroll: false }),
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [draft.value, query.search, params, path, router]);
  const result = useQuery({
    queryKey: purchaseKeys.list(query),
    queryFn: () => getPurchasePage(query),
    retry: false,
  });
  const lastPage = result.data
    ? Math.max(1, Math.ceil(result.data.total / query.page_size))
    : null;
  useEffect(() => {
    if (lastPage === null || query.page <= lastPage || result.isFetching)
      return;
    const next = new URLSearchParams(params);
    next.set("page", String(lastPage));
    router.replace(`${path}?${next}`, { scroll: false });
  }, [lastPage, query.page, result.isFetching, params, path, router]);
  const purchaseId = params.get("purchase_id");
  const detail = useQuery({
    queryKey: purchaseKeys.detail(purchaseId),
    queryFn: () => getPurchaseDetail(purchaseId!),
    enabled: !!purchaseId,
    retry: false,
  });
  function closeDetail() {
    const next = new URLSearchParams(params);
    next.delete("purchase_id");
    router.replace(`${path}?${next}`, { scroll: false });
  }
  const loading =
    result.isFetching || navigating || draft.value !== query.search;
  return {
    query,
    search: draft.value,
    setSearch: (value: string) => setDraft({ applied: query.search, value }),
    update,
    result,
    loading,
    purchaseId,
    detail,
    closeDetail,
  };
}
