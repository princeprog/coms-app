// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { useDirectoryQuery } from "@/hooks/use-directory-query";
import { createSalesHref } from "../services/sales-page-params";
import { PosMenuControls } from "./pos-menu-controls";

const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());
const categoryId = "aa000000-0000-4000-8000-000000000001";
const filters = {
  branchId: "aa000000-0000-4000-8000-000000000002",
  page: 3,
  historyPage: 2,
  search: "",
  serviceType: "TAKEAWAY" as const,
};

function Controls(
  props: Omit<ComponentProps<typeof PosMenuControls>, "query">,
) {
  const query = useDirectoryQuery(props.filters, createSalesHref);
  return (
    <>
      <PosMenuControls {...props} query={query} />
      <button
        type="button"
        onClick={() => query.apply({ serviceType: "DINE_IN" })}
      >
        Change service
      </button>
    </>
  );
}

it("combines a queued search with a category change and resets only menu pagination", () => {
  vi.useFakeTimers();
  render(
    <Controls
      filters={filters}
      categories={[{ id: categoryId, name: "Rice meals" }]}
      categoriesUnavailable={false}
    />,
  );
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "adobo" },
  });
  act(() => vi.advanceTimersByTime(200));
  expect(replace).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Rice meals" }));
  act(() => vi.advanceTimersByTime(350));
  expect(replace).toHaveBeenCalledTimes(1);
  const query = new URL(replace.mock.calls[0][0], "http://localhost")
    .searchParams;
  expect(Object.fromEntries(query)).toEqual({
    branch_id: filters.branchId,
    category_id: categoryId,
    history_page: "2",
    search: "adobo",
    service_type: "TAKEAWAY",
  });
});

it("clears category and search while preserving branch/service context", () => {
  render(
    <Controls
      filters={{ ...filters, categoryId, search: "adobo" }}
      categories={[{ id: categoryId, name: "Rice meals" }]}
      categoriesUnavailable={false}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  const query = new URL(replace.mock.calls[0][0], "http://localhost")
    .searchParams;
  expect(query.has("category_id")).toBe(false);
  expect(query.has("search")).toBe(false);
  expect(query.get("service_type")).toBe("TAKEAWAY");
  expect(screen.getByRole("searchbox")).toBe(document.activeElement);
});

it("offers a retry when category options fail without inventing categories", () => {
  render(<Controls filters={filters} categories={[]} categoriesUnavailable />);
  fireEvent.click(screen.getByRole("button", { name: "Retry categories" }));
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("alert").textContent).toContain(
    "Categories couldn’t be loaded",
  );
});

it("combines a queued search, service switch and category selection", () => {
  vi.useFakeTimers();
  render(
    <Controls
      filters={filters}
      categories={[{ id: categoryId, name: "Rice meals" }]}
      categoriesUnavailable={false}
    />,
  );
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "adobo" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Change service" }));
  fireEvent.click(screen.getByRole("button", { name: "Rice meals" }));
  act(() => vi.advanceTimersByTime(400));
  const query = new URL(replace.mock.lastCall![0], "http://localhost")
    .searchParams;
  expect(query.get("service_type")).toBe("DINE_IN");
  expect(query.get("category_id")).toBe(categoryId);
  expect(query.get("search")).toBe("adobo");
});
