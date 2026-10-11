"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchProductBranchesAction } from "../services/product-branch-actions";
import type { SetupBranch } from "../schemas/product-setup.schema";
import { productBranchQueryKey } from "../query-keys";

export function useProductBranches(
  branches: SetupBranch[],
  total: number,
  enabled: boolean,
) {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    if (search.trim() === appliedSearch) return;
    const timeout = window.setTimeout(() => {
      setAppliedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search, appliedSearch]);
  const query = useQuery({
    queryKey: productBranchQueryKey(appliedSearch, page),
    queryFn: async () => {
      const result = await searchProductBranchesAction({
        page,
        search: appliedSearch,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled,
    initialData:
      page === 1 && !appliedSearch
        ? { items: branches, total, page: 1, page_size: 25 }
        : undefined,
    staleTime: 30_000,
    retry: false,
  });
  return { search, setSearch, page, setPage, ...query };
}
