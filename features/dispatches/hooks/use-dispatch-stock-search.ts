"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchDispatchStock } from "../services/dispatch-stock-actions";

export function useDispatchStockSearch(availabilityVisible = false) {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: ["dispatch-stock", availabilityVisible, appliedSearch, page],
    queryFn: () => searchDispatchStock({ search: appliedSearch, page }),
    retry: false,
    staleTime: 0,
  });
  // During debounce do not offer options for the previous search.
  const changing = search !== appliedSearch;
  return {
    ...query,
    data: changing ? undefined : query.data,
    isPending: changing || query.isPending,
    search,
    setSearch,
    page,
    setPage,
  };
}
