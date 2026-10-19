// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDirectoryQuery } from "./use-directory-query";
import {
  createDispatchHref,
  type DispatchPageFilters,
} from "@/features/dispatches/services/dispatch-page-params";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
const filters: DispatchPageFilters = {
  page: 3,
  pageSize: 20,
  status: "IN_TRANSIT",
  discrepancyStatus: "all",
};

describe("directory query navigation", () => {
  beforeEach(() => {
    replace.mockReset();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("debounces rapid typing into one first-page request and merges filters", () => {
    const { result } = renderHook(() =>
      useDirectoryQuery(filters, createDispatchHref),
    );
    act(() => result.current.changeSearch("M"));
    act(() => vi.advanceTimersByTime(200));
    act(() => result.current.changeSearch("Main"));
    act(() => vi.advanceTimersByTime(349));
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledExactlyOnceWith(
      "/dispatches?page_size=20&status=IN_TRANSIT&search=Main",
      { scroll: false },
    );
  });

  it("changes pages without clearing filters and resets to page one when the size changes", () => {
    const { result } = renderHook(() =>
      useDirectoryQuery(filters, createDispatchHref),
    );
    act(() => result.current.apply({ page: 4 }, { resetPage: false }));
    expect(replace).toHaveBeenLastCalledWith(
      "/dispatches?page=4&page_size=20&status=IN_TRANSIT",
      { scroll: false },
    );
    act(() => result.current.apply({ pageSize: 50 }));
    expect(replace).toHaveBeenLastCalledWith(
      "/dispatches?page_size=50&status=IN_TRANSIT",
      { scroll: false },
    );
  });

  it("cancels an issued search when clearing back to the currently rendered URL", () => {
    const { result } = renderHook(() =>
      useDirectoryQuery({ ...filters, page: 1 }, createDispatchHref),
    );
    act(() => result.current.changeSearch("Main"));
    act(() => vi.advanceTimersByTime(350));
    act(() => {
      result.current.changeSearch("");
      result.current.apply({ search: "" });
    });
    expect(replace).toHaveBeenLastCalledWith(
      "/dispatches?page_size=20&status=IN_TRANSIT",
      { scroll: false },
    );
  });

  it("preserves a newer draft when an earlier request finishes, and restores search on back navigation", () => {
    const { result, rerender } = renderHook(
      ({ current }) => useDirectoryQuery(current, createDispatchHref),
      { initialProps: { current: filters } },
    );
    act(() => result.current.changeSearch("Main"));
    act(() => vi.advanceTimersByTime(350));
    act(() => result.current.changeSearch("Main North"));
    rerender({ current: { ...filters, page: 1, search: "Main" } });
    expect(result.current.search).toBe("Main North");
    act(() => vi.advanceTimersByTime(350));
    expect(replace).toHaveBeenLastCalledWith(
      "/dispatches?page_size=20&status=IN_TRANSIT&search=Main+North",
      { scroll: false },
    );
    rerender({ current: { ...filters, page: 1, search: "Main North" } });
    rerender({ current: filters });
    expect(result.current.search).toBe("");
  });
});
