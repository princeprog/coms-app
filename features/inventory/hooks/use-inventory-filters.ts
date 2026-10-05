"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { createInventoryHref } from "../services/inventory-page-params";
import type { InventoryScopeFilterProps } from "../types/inventory-filter.types";

const SEARCH_DEBOUNCE_MS = 350;

export function useInventoryFilters({
  scope,
  branchOptions,
  selectedBranchId,
  search,
  statusFilter,
  categoryFilter,
  branchName,
  page,
  onPendingChange,
}: InventoryScopeFilterProps) {
  const router = useRouter();
  const resolvedBranchId = selectedBranchId ?? branchOptions[0]?.id;
  const filterStateKey = JSON.stringify([
    scope,
    resolvedBranchId ?? "",
    search,
    statusFilter ?? "",
    categoryFilter ?? "",
  ]);
  const [searchDraft, setSearchDraft] = useState({
    key: filterStateKey,
    value: search,
  });
  const draftSearch =
    searchDraft.key === filterStateKey ? searchDraft.value : search;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationValue =
    scope === "COMMISSARY" ? "COMMISSARY" : `BRANCH:${resolvedBranchId ?? ""}`;
  const locationLabel = branchName;

  useEffect(() => {
    onPendingChange(false);
  }, [
    search,
    scope,
    resolvedBranchId,
    statusFilter,
    categoryFilter,
    page,
    onPendingChange,
  ]);

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    [],
  );

  function applyFilters(
    options: {
      nextScope?: "COMMISSARY" | "BRANCH";
      nextBranchId?: string | null;
      nextSearch?: string;
      nextStatus?: "active" | "inactive" | null;
      nextCategory?: string | null;
      addHistoryEntry?: boolean;
    } = {},
  ) {
    const nextScope = options.nextScope ?? scope;
    const nextBranchId =
      options.nextBranchId === null
        ? undefined
        : (options.nextBranchId ?? resolvedBranchId);
    const nextSearch = options.nextSearch ?? draftSearch;
    const nextStatus =
      options.nextStatus === null
        ? undefined
        : (options.nextStatus ?? statusFilter);
    const nextCategory =
      options.nextCategory === null
        ? undefined
        : (options.nextCategory ?? categoryFilter);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    const normalizedSearch = nextSearch.trim();
    if (
      nextScope === scope &&
      (nextScope !== "BRANCH" || nextBranchId === resolvedBranchId) &&
      normalizedSearch === search &&
      nextStatus === statusFilter &&
      nextCategory === categoryFilter &&
      page === 1
    ) {
      return;
    }

    const href = createInventoryHref({
      scope: nextScope,
      branchId: nextScope === "BRANCH" ? nextBranchId : undefined,
      page: 1,
      search: normalizedSearch,
      status: nextStatus,
      category: nextCategory,
    });

    onPendingChange(true);
    if (options.addHistoryEntry) router.push(href, { scroll: false });
    else router.replace(href, { scroll: false });
  }

  function handleSearchChange(value: string) {
    setSearchDraft({ key: filterStateKey, value });
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
      applyFilters({ nextSearch: value });
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    applyFilters({ nextSearch: draftSearch });
  }

  function handleLocationChange(value: string) {
    if (value === "COMMISSARY") {
      applyFilters({
        nextScope: "COMMISSARY",
        nextBranchId: null,
        addHistoryEntry: true,
      });
      return;
    }

    const branchId = value.startsWith("BRANCH:")
      ? value.slice("BRANCH:".length)
      : "";
    if (!branchId) return;
    applyFilters({
      nextScope: "BRANCH",
      nextBranchId: branchId,
      addHistoryEntry: true,
    });
  }

  return {
    draftSearch,
    locationValue,
    locationLabel,
    applyFilters,
    handleSearchChange,
    handleSearchKeyDown,
    handleLocationChange,
  };
}
