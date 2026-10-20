"use client";
import { purchaseKeys } from "../query-keys";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchPurchaseStock } from "../services/purchase-actions";
export function usePurchaseStock() {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setApplied(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: purchaseKeys.stock(applied, page),
    queryFn: () => searchPurchaseStock({ search: applied, page }),
    retry: false,
    staleTime: 0,
  });
  return {
    ...query,
    data: search !== applied ? undefined : query.data,
    isPending: search !== applied || query.isPending,
    search,
    setSearch,
    page,
    setPage,
  };
}
