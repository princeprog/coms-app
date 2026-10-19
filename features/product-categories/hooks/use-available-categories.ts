"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAvailableCategoriesAction } from "../services/product-category-actions";
import { categoryQueryKeys } from "../query-keys";

export function useAvailableCategories(enabled: boolean) {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const searching = search.trim() !== appliedSearch;
  useEffect(() => {
    if (!searching) return;
    const timeout = window.setTimeout(() => {
      setAppliedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search, searching]);
  const query = useQuery({
    queryKey: categoryQueryKeys.available(appliedSearch, page),
    enabled,
    queryFn: async () => {
      const result = await searchAvailableCategoriesAction({
        page,
        page_size: 10,
        search: appliedSearch,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    retry: false,
    staleTime: 0,
  });
  return { ...query, search, setSearch, page, setPage, searching };
}
