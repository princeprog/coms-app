"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productRecipeStockQueryKey } from "../query-keys";
import { searchRecipeStock } from "../services/product-recipe-actions";

export function useRecipeStock(enabled: boolean) {
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
    queryKey: productRecipeStockQueryKey(applied, page),
    queryFn: () => searchRecipeStock({ search: applied, page }),
    enabled,
    retry: false,
    staleTime: 30_000,
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
