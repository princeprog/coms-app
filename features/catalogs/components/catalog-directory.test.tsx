// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogManagement } from "./catalog-management";
import {
  supplierFields,
  supplierDisplayColumns,
} from "@/features/suppliers/constants";
import {
  stockItemFields,
  stockItemDisplayColumns,
} from "@/features/stock-items/constants";
const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
const props = {
  title: "Suppliers",
  resourceName: "supplier",
  description: "Manage supplier contacts.",
  routePath: "/suppliers",
  fields: supplierFields,
  displayColumns: supplierDisplayColumns,
  page: {
    items: [
      {
        id: "supplier-1",
        supplier_name: "North Farm",
        contact_number: "09170000001",
        email: null,
        is_active: true,
      },
    ],
    total: 51,
    page: 3,
    page_size: 25,
  },
  search: "North",
  activeFilter: "true" as const,
  canCreate: false,
  canUpdate: false,
  canDeactivate: false,
  createAction: vi.fn(),
  updateAction: vi.fn(),
  deactivateAction: vi.fn(),
  directoryLayout: true,
};
afterEach(() => {
  vi.useRealTimers();
  replace.mockReset();
  refresh.mockReset();
});
describe("catalog directories", () => {
  it("shows labeled search, applied chips, readable contact data and integrated result pagination", async () => {
    const user = userEvent.setup();
    render(<CatalogManagement {...props} />);
    expect(
      screen.getByRole("heading", { name: "Suppliers", level: 2 }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Apply filters" })).toBeNull();
    expect(
      screen
        .getByRole("region", { name: "Suppliers table" })
        .getAttribute("tabindex"),
    ).toBe("0");
    expect(screen.getAllByText("09170000001")).toHaveLength(1);
    expect(screen.getByText("Phone: 09170000001")).toBeTruthy();
    expect(screen.getByText("Showing 51–51 of 51 suppliers")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Previous page" }).getAttribute("href"),
    ).toBe("/suppliers?page=2&search=North&is_active=true");
    await user.click(
      screen.getByRole("button", { name: "More actions for North Farm" }),
    );
    expect(
      await screen.findByRole("menuitem", { name: "View details" }),
    ).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: "Edit" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Deactivate" })).toBeNull();
  });
  it("debounces search and resets pagination while retaining status", () => {
    vi.useFakeTimers();
    render(<CatalogManagement {...props} />);
    const input = screen.getByRole("searchbox", { name: "Search suppliers" });
    fireEvent.change(input, { target: { value: "North F" } });
    act(() => vi.advanceTimersByTime(200));
    fireEvent.change(input, { target: { value: "North Farm" } });
    act(() => vi.advanceTimersByTime(349));
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledExactlyOnceWith(
      "/suppliers?search=North+Farm&is_active=true",
      { scroll: false },
    );
  });
  it("removes applied chips independently, clears all and restores focus", async () => {
    const user = userEvent.setup();
    render(<CatalogManagement {...props} />);
    await user.click(
      screen.getByRole("button", { name: "Remove status: Active" }),
    );
    expect(replace).toHaveBeenLastCalledWith("/suppliers?search=North", {
      scroll: false,
    });
    expect(document.activeElement).toBe(
      screen.getByRole("combobox", { name: "Status" }),
    );
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(replace).toHaveBeenLastCalledWith("/suppliers", { scroll: false });
    expect(document.activeElement).toBe(
      screen.getByRole("searchbox", { name: "Search suppliers" }),
    );
  });
  it("preserves newer typing through an older response and cancels drafts on external navigation", () => {
    vi.useFakeTimers();
    const view = render(<CatalogManagement {...props} search="" />);
    const input = screen.getByRole("searchbox", { name: "Search suppliers" });
    fireEvent.change(input, { target: { value: "North" } });
    act(() => vi.advanceTimersByTime(350));
    fireEvent.change(input, { target: { value: "North Farm" } });
    view.rerender(
      <CatalogManagement
        {...props}
        page={{ ...props.page, page: 1 }}
        search="North"
      />,
    );
    expect(input).toHaveProperty("value", "North Farm");
    act(() => vi.advanceTimersByTime(350));
    expect(replace).toHaveBeenLastCalledWith(
      "/suppliers?search=North+Farm&is_active=true",
      { scroll: false },
    );
    view.rerender(<CatalogManagement {...props} search="External" />);
    expect(input).toHaveProperty("value", "External");
  });
  it("keeps stock item category and unit data visible and exposes permitted creation", async () => {
    const user = userEvent.setup();
    render(
      <CatalogManagement
        {...props}
        title="Stock Items"
        resourceName="stock item"
        routePath="/stock-items"
        fields={stockItemFields}
        displayColumns={stockItemDisplayColumns}
        search=""
        activeFilter="all"
        canCreate
        page={{
          ...props.page,
          page: 1,
          total: 1,
          items: [
            {
              id: "stock-1",
              stock_item_name: "Flour",
              unit: "kg",
              category: "Dry goods",
              is_active: true,
            },
          ],
        }}
      />,
    );
    const table = screen.getByRole("table", { name: "Stock Items" });
    expect(within(table).getByText("kg")).toBeTruthy();
    expect(within(table).getAllByText("Dry goods")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Add stock item" }));
    expect(
      screen.getByRole("dialog", { name: "Create stock item" }),
    ).toBeTruthy();
  });
  it("offers clearing for filtered-empty results without a misleading create action", () => {
    render(
      <CatalogManagement
        {...props}
        canCreate
        page={{ ...props.page, items: [], total: 0, page: 1 }}
      />,
    );
    expect(screen.getByText("No suppliers found")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Clear filters" }).getAttribute("href"),
    ).toBe("/suppliers");
    expect(
      screen.getAllByRole("button", { name: "Add supplier" }),
    ).toHaveLength(1);
  });
});
