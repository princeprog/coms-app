// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryManagement } from "./inventory-management";

const { refresh, push, replace } = vi.hoisted(() => ({
  refresh: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push, replace }),
}));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const secondBranchId = "540a8340-3556-47a3-9858-10a4f29d2611";
const timestamp = "2026-09-24T01:30:00.000Z";
const inventory = {
  items: [
    {
      id: branchId,
      stock_item_name: "Flour",
      category: "Dry goods",
      unit: "kg",
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
      quantity_on_hand: "2.500",
    },
    {
      id: "540a8340-3556-47a3-9858-10a4f29d2611",
      stock_item_name: "Cooking oil",
      category: "Pantry",
      unit: "L",
      is_active: false,
      created_at: timestamp,
      updated_at: timestamp,
      quantity_on_hand: "0",
    },
  ],
  total: 2,
  page: 1,
  page_size: 25,
  available_categories: ["Dry goods", "Pantry"],
};
const movements = {
  items: [
    {
      id: "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a",
      inventory_scope: "BRANCH" as const,
      branch_id: branchId,
      stock_item_id: branchId,
      stock_item_name: "Flour",
      unit: "kg",
      movement_type: "RECEIPT" as const,
      quantity_delta: "2.5",
      reason: "Supplier receipt",
      actor_user_id: branchId,
      idempotency_key: null,
      created_at: timestamp,
    },
  ],
  total: 1,
  page: 1,
  page_size: 25,
};

function renderInventory(
  overrides: Partial<ComponentProps<typeof InventoryManagement>> = {},
) {
  return render(
    <InventoryManagement
      inventory={inventory}
      movements={movements}
      scope="BRANCH"
      branchOptions={[{ id: branchId, name: "Manila North" }]}
      selectedBranchId={branchId}
      search="Flour"
      canAdjust
      canViewCommissary
      canViewBranch
      adjustAction={vi.fn()}
      {...overrides}
    />,
  );
}

describe("inventory management", () => {
  beforeEach(() => {
    refresh.mockClear();
    push.mockClear();
    replace.mockClear();
    vi.useRealTimers();
  });

  it("shows exact on-hand values and recent ledger movements", () => {
    renderInventory();

    expect(
      screen.getByRole("heading", { name: "Stock balances" }),
    ).toBeTruthy();
    expect(screen.getByText("2.500 kg")).toBeTruthy();
    expect(screen.getAllByText("Supplier receipt")).toHaveLength(2);
    expect(screen.getByRole("combobox", { name: "Branch" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Status" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Category" })).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Branch" }).textContent,
    ).toContain("Manila North");
    expect(
      screen.getByRole("combobox", { name: "Status" }).textContent,
    ).toContain("All statuses");
    expect(
      screen.getByRole("combobox", { name: "Category" }).textContent,
    ).toContain("All categories");
  });

  it("limits the scope to Branches and shows authorized branch choices for branch-only access", () => {
    renderInventory({
      canViewCommissary: false,
      canViewBranch: true,
      canAdjust: false,
      branchOptions: [
        { id: branchId, name: "Manila North" },
        { id: secondBranchId, name: "Manila South" },
      ],
    });

    expect(screen.getByRole("combobox", { name: "Branch" })).toBeTruthy();
    expect(
      screen.getByText("Stock balances and recent movements for Manila North."),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Commissary" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "Branches" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByRole("searchbox", { name: "Search stock items" }),
    ).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Status" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Category" })).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Actions" })).toBeNull();
    expect(screen.getByRole("columnheader", { name: "Unit" })).toBeTruthy();
  });

  it("hides the branch scope for commissary-only users", () => {
    renderInventory({
      scope: "COMMISSARY",
      canViewCommissary: true,
      canViewBranch: false,
    });

    expect(screen.getByText("Commissary")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "Branch" })).toBeNull();
  });

  it("keeps scope controls when commissary read is granted without adjustment", () => {
    renderInventory({ canViewCommissary: true, canAdjust: false });

    expect(screen.getByRole("combobox", { name: "Branch" })).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Actions" })).toBeNull();
  });

  it("keeps branch adjustment actions when only branch adjustment is granted", () => {
    renderInventory({ canViewCommissary: false, canAdjust: true });

    expect(screen.getByRole("combobox", { name: "Branch" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Actions" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Actions for Flour" }),
    ).toBeTruthy();
  });

  it("keeps stock balances and movements in labeled scroll regions", () => {
    const { container } = renderInventory();

    expect(
      container.querySelector('[data-coms-ui="operational"]'),
    ).not.toBeNull();
    const balanceRegion = screen.getByRole("region", {
      name: "Stock balances table",
    });
    const movementRegion = screen.getByRole("region", {
      name: "Recent inventory movements table",
    });
    expect(balanceRegion.getAttribute("data-slot")).toBe("table-container");
    expect(balanceRegion.getAttribute("tabindex")).toBe("0");
    expect(movementRegion.getAttribute("data-slot")).toBe("table-container");
    expect(movementRegion.getAttribute("tabindex")).toBe("0");
  });

  it("hides adjustment actions when not granted and for inactive stock", () => {
    renderInventory({ canAdjust: false });

    expect(
      screen.queryByRole("button", { name: "Actions for Flour" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Actions for Cooking oil" }),
    ).toBeNull();
    expect(screen.getAllByText("Inactive")).toHaveLength(2);
    expect(screen.queryByRole("columnheader", { name: "Actions" })).toBeNull();
    expect(screen.queryByText("Adjustment unavailable")).toBeNull();
  });

  it("hides adjustments for inactive branches while keeping their inventory visible", () => {
    renderInventory({
      branchOptions: [
        { id: branchId, name: "Manila North", status: "inactive" },
      ],
    });

    expect(
      screen.getByRole("combobox", { name: "Branch" }).textContent,
    ).toContain("Manila North");
    expect(screen.getByText("Inactive · adjustments disabled")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Actions for Flour" }),
    ).toBeNull();
    expect(screen.getByText("2.500 kg")).toBeTruthy();
  });

  it("keeps commissary adjustments available when an assigned branch is inactive", () => {
    renderInventory({
      scope: "COMMISSARY",
      branchOptions: [
        { id: branchId, name: "Manila North", status: "inactive" },
      ],
    });

    expect(
      screen.getByRole("button", { name: "Actions for Flour" }),
    ).toBeTruthy();
  });

  it("preserves location and all filters when moving between inventory pages", () => {
    renderInventory({
      inventory: { ...inventory, total: 51 },
      search: "Flour",
      statusFilter: "active",
      categoryFilter: "Dry goods",
      page: 1,
    });

    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe(
      `/inventory?scope=BRANCH&branch_id=${branchId}&page=2&search=Flour&status=active&category=Dry+goods`,
    );
  });

  it("reflects browser history changes in the location and filter controls", () => {
    const branchOptions = [
      { id: branchId, name: "Manila North" },
      { id: secondBranchId, name: "Manila South" },
    ];
    const { rerender } = renderInventory({
      branchOptions,
      selectedBranchId: branchId,
    });
    const searchInput = screen.getByRole("searchbox", {
      name: "Search stock items",
    });
    searchInput.focus();
    expect(
      screen.getByRole("combobox", { name: "Branch" }).textContent,
    ).toContain("Manila North");

    rerender(
      <InventoryManagement
        inventory={inventory}
        movements={movements}
        scope="BRANCH"
        branchOptions={branchOptions}
        selectedBranchId={secondBranchId}
        search="Cooking oil"
        statusFilter="inactive"
        categoryFilter="Pantry"
        canAdjust
        canViewCommissary
        canViewBranch
        adjustAction={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "Branch" }).textContent,
    ).toContain("Manila South");
    expect(
      screen.getByRole("combobox", { name: "Status" }).textContent,
    ).toContain("Inactive");
    expect(
      screen.getByRole("combobox", { name: "Category" }).textContent,
    ).toContain("Pantry");
    expect(
      (
        screen.getByRole("searchbox", {
          name: "Search stock items",
        }) as HTMLInputElement
      ).value,
    ).toBe("Cooking oil");
    expect(screen.getByRole("searchbox", { name: "Search stock items" })).toBe(
      searchInput,
    );
    expect(document.activeElement).toBe(searchInput);
  });

  it("applies location changes immediately, resets the page, and shows pending feedback", async () => {
    const user = userEvent.setup();
    renderInventory({
      scope: "BRANCH",
      branchOptions: [
        { id: branchId, name: "Manila North" },
        { id: secondBranchId, name: "Manila South" },
      ],
      selectedBranchId: branchId,
      search: "Flour",
      statusFilter: "active",
      categoryFilter: "Dry goods",
      page: 3,
    });

    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(
      await screen.findByRole("option", { name: "Manila South" }),
    );

    expect(push).toHaveBeenCalledWith(
      `/inventory?scope=BRANCH&branch_id=${secondBranchId}&search=Flour&status=active&category=Dry+goods`,
      { scroll: false },
    );
    expect(screen.getByRole("status").textContent).toContain(
      "Updating inventory",
    );
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it("switches between Commissary and Branches while preserving filters and resetting pagination", async () => {
    const user = userEvent.setup();
    const { rerender } = renderInventory({
      scope: "COMMISSARY",
      page: 3,
      statusFilter: "active",
      categoryFilter: "Dry goods",
    });
    expect(screen.queryByRole("combobox", { name: "Branch" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Branches" }));
    expect(push).toHaveBeenLastCalledWith(
      `/inventory?scope=BRANCH&branch_id=${branchId}&search=Flour&status=active&category=Dry+goods`,
      { scroll: false },
    );
    rerender(
      <InventoryManagement
        inventory={inventory}
        movements={movements}
        scope="BRANCH"
        branchOptions={[{ id: branchId, name: "Manila North" }]}
        selectedBranchId={branchId}
        search="Flour"
        statusFilter="active"
        categoryFilter="Dry goods"
        canAdjust
        canViewCommissary
        canViewBranch
        adjustAction={vi.fn()}
        page={1}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Branch" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Branches" }));
    expect(push).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Commissary" }));
    expect(push).toHaveBeenLastCalledWith(
      "/inventory?scope=COMMISSARY&search=Flour&status=active&category=Dry+goods",
      { scroll: false },
    );
  });

  it("applies status and category selections immediately and resets pagination", async () => {
    const user = userEvent.setup();
    const { rerender } = renderInventory({
      scope: "COMMISSARY",
      search: "Flour",
      page: 4,
    });

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Inactive" }));
    expect(replace).toHaveBeenLastCalledWith(
      "/inventory?scope=COMMISSARY&search=Flour&status=inactive",
      { scroll: false },
    );

    rerender(
      <InventoryManagement
        inventory={inventory}
        movements={movements}
        scope="COMMISSARY"
        branchOptions={[]}
        search="Flour"
        statusFilter="inactive"
        canAdjust={false}
        canViewCommissary
        canViewBranch={false}
        adjustAction={vi.fn()}
        page={1}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await user.click(await screen.findByRole("option", { name: "Dry goods" }));

    expect(replace).toHaveBeenLastCalledWith(
      "/inventory?scope=COMMISSARY&search=Flour&status=inactive&category=Dry+goods",
      { scroll: false },
    );
  });

  it("removes status and category parameters when their All options are selected", async () => {
    const user = userEvent.setup();
    const { rerender } = renderInventory({
      scope: "COMMISSARY",
      search: "",
      statusFilter: "active",
      categoryFilter: "Dry goods",
    });

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(
      await screen.findByRole("option", { name: "All statuses" }),
    );
    expect(replace).toHaveBeenLastCalledWith(
      "/inventory?scope=COMMISSARY&category=Dry+goods",
      { scroll: false },
    );

    rerender(
      <InventoryManagement
        inventory={inventory}
        movements={movements}
        scope="COMMISSARY"
        branchOptions={[]}
        search=""
        categoryFilter="Dry goods"
        canAdjust={false}
        canViewCommissary
        canViewBranch={false}
        adjustAction={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await user.click(
      await screen.findByRole("option", { name: "All categories" }),
    );
    expect(replace).toHaveBeenLastCalledWith("/inventory?scope=COMMISSARY", {
      scroll: false,
    });
  });

  it("debounces search by 350ms and exposes pending state while results load", async () => {
    vi.useFakeTimers();
    renderInventory({ scope: "COMMISSARY", search: "Flour", page: 2 });
    const search = screen.getByRole("searchbox", {
      name: "Search stock items",
    });

    fireEvent.change(search, { target: { value: "Cooking oil" } });
    act(() => vi.advanceTimersByTime(349));
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));

    expect(replace).toHaveBeenCalledWith(
      "/inventory?scope=COMMISSARY&search=Cooking+oil",
      { scroll: false },
    );
    expect(screen.getByRole("status").textContent).toContain(
      "Updating inventory",
    );
    expect((search as HTMLInputElement).value).toBe("Cooking oil");
  });

  it("applies search immediately on Enter", async () => {
    renderInventory({ scope: "COMMISSARY", search: "Flour" });

    const search = screen.getByRole("searchbox", {
      name: "Search stock items",
    });
    fireEvent.change(search, { target: { value: "Rice" } });
    fireEvent.keyDown(search, { key: "Enter", code: "Enter" });

    expect(replace).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith(
      "/inventory?scope=COMMISSARY&search=Rice",
      { scroll: false },
    );
    expect((search as HTMLInputElement).value).toBe("Rice");
  });

  it("clears pending feedback when the same filter resets pagination", () => {
    const view = renderInventory({
      scope: "COMMISSARY",
      search: "Flour",
      page: 2,
    });
    const search = screen.getByRole("searchbox", {
      name: "Search stock items",
    });
    fireEvent.keyDown(search, { key: "Enter", code: "Enter" });

    expect(replace).toHaveBeenCalledWith(
      "/inventory?scope=COMMISSARY&search=Flour",
      { scroll: false },
    );
    expect(screen.getByRole("status")).toBeTruthy();

    view.rerender(
      <InventoryManagement
        inventory={inventory}
        movements={movements}
        scope="COMMISSARY"
        branchOptions={[{ id: branchId, name: "Manila North" }]}
        selectedBranchId={branchId}
        search="Flour"
        canAdjust
        canViewCommissary
        canViewBranch={false}
        adjustAction={vi.fn()}
        page={1}
      />,
    );

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("explains when there is no assigned branch", () => {
    renderInventory({
      inventory: null,
      movements: null,
      branchOptions: [],
      selectedBranchId: undefined,
      branchUnavailable: true,
      canViewCommissary: false,
    });
    expect(
      screen.getByText("No branch is assigned to this account."),
    ).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "Branch" })).toBeNull();
    expect(
      screen.queryByRole("searchbox", { name: "Search stock items" }),
    ).toBeNull();
  });

  it("explains when a search has no matching stock", () => {
    renderInventory({
      inventory: { ...inventory, items: [], total: 0 },
      movements: { ...movements, items: [], total: 0 },
      scope: "COMMISSARY",
      branchOptions: [],
      search: "Unknown item",
      canAdjust: false,
    });

    expect(
      screen.getByText("No stock items match these filters."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeTruthy();
  });

  it("clears filters while retaining the selected location", async () => {
    const user = userEvent.setup();
    renderInventory({
      inventory: { ...inventory, items: [], total: 0 },
      scope: "BRANCH",
      search: "Unknown item",
      statusFilter: "inactive",
      categoryFilter: "Dry goods",
    });

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(replace).toHaveBeenCalledWith(
      `/inventory?scope=BRANCH&branch_id=${branchId}`,
      { scroll: false },
    );
    expect(screen.getByRole("status").textContent).toContain(
      "Updating inventory",
    );
  });

  it("removes one applied filter or clears all while preserving the inventory location", async () => {
    const user = userEvent.setup();
    renderInventory({
      search: "Flour",
      statusFilter: "inactive",
      categoryFilter: "Dry goods",
      page: 3,
    });
    await user.click(
      screen.getByRole("button", { name: "Remove Status: Inactive" }),
    );
    expect(replace).toHaveBeenLastCalledWith(
      `/inventory?scope=BRANCH&branch_id=${branchId}&search=Flour&category=Dry+goods`,
      { scroll: false },
    );
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(replace).toHaveBeenLastCalledWith(
      `/inventory?scope=BRANCH&branch_id=${branchId}`,
      { scroll: false },
    );
  });

  it("shows a recoverable error when inventory data fails to load", () => {
    renderInventory({ inventory: null, movements: null });

    expect(
      screen.getByText(
        "COMS could not load inventory data. Try again in a moment.",
      ),
    ).toBeTruthy();
  });

  it("explains when no stock items have been configured", () => {
    renderInventory({
      inventory: { ...inventory, items: [], total: 0 },
      movements: { ...movements, items: [], total: 0 },
      scope: "COMMISSARY",
      branchOptions: [],
      search: "",
      canAdjust: false,
    });

    expect(
      screen.getByText("No stock items have been set up yet."),
    ).toBeTruthy();
    expect(screen.getByText("No movement history yet")).toBeTruthy();
  });
});
