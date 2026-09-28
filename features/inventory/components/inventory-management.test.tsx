// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { InventoryManagement } from "./inventory-management";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

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
  it("shows exact on-hand values and recent ledger movements", () => {
    renderInventory();

    expect(
      screen.getByRole("heading", { name: "Stock balances" }),
    ).toBeTruthy();
    expect(screen.getByText("2.500 kg")).toBeTruthy();
    expect(screen.getByText("Supplier receipt")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Branch inventory" })
        .getAttribute("aria-current"),
    ).toBe("page");
  });

  it("shows a fixed assigned branch instead of scope and branch filters for branch-only access", () => {
    renderInventory({
      canViewCommissary: false,
      canViewBranch: true,
      canAdjust: false,
      branchOptions: [
        { id: branchId, name: "Manila North" },
        { id: secondBranchId, name: "Manila South" },
      ],
    });

    expect(
      screen.queryByRole("navigation", { name: "Inventory scope" }),
    ).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Branch" })).toBeNull();
    expect(
      screen.getByText("Stock balances and recent movements for Manila North."),
    ).toBeTruthy();
    expect(screen.getAllByText("Manila North")).toHaveLength(2);
    expect(screen.getByText("Showing data for")).toBeTruthy();
    const form = screen.getByRole("form", {
      name: "Search stock items in assigned branch",
    });
    expect(
      form.querySelector('input[name="scope"]')?.getAttribute("value"),
    ).toBe("BRANCH");
    expect(
      form.querySelector('input[name="branch_id"]')?.getAttribute("value"),
    ).toBe(branchId);
    expect(
      screen.getByRole("searchbox", { name: "Search stock items" }),
    ).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Actions" })).toBeNull();
    expect(screen.getByRole("columnheader", { name: "Unit" })).toBeTruthy();
  });

  it("hides the branch scope for commissary-only users", () => {
    renderInventory({
      scope: "COMMISSARY",
      canViewCommissary: true,
      canViewBranch: false,
    });

    expect(
      screen.getByRole("link", { name: "Commissary inventory" }),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Branch inventory" })).toBeNull();
  });

  it("keeps scope controls when commissary read is granted without adjustment", () => {
    renderInventory({ canViewCommissary: true, canAdjust: false });

    expect(
      screen.getByRole("navigation", { name: "Inventory scope" }),
    ).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Branch" })).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Actions" })).toBeNull();
  });

  it("keeps branch adjustment actions when only branch adjustment is granted", () => {
    renderInventory({ canViewCommissary: false, canAdjust: true });

    expect(screen.queryByRole("combobox", { name: "Branch" })).toBeNull();
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
    expect(screen.getByText("Inactive")).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Actions" })).toBeNull();
    expect(screen.queryByText("Adjustment unavailable")).toBeNull();
  });

  it("hides adjustments for inactive branches while keeping their inventory visible", () => {
    renderInventory({
      branchOptions: [
        { id: branchId, name: "Manila North", status: "inactive" },
      ],
    });

    expect(screen.getByText("Manila North")).toBeTruthy();
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

  it("preserves scope and branch selection when moving between inventory pages", () => {
    renderInventory({
      inventory: { ...inventory, total: 51 },
      search: "Flour",
      page: 1,
    });

    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe(`/inventory?scope=BRANCH&branch_id=${branchId}&page=2&search=Flour`);
  });

  it("updates the selected branch when the URL selection changes", () => {
    const branchOptions = [
      { id: branchId, name: "Manila North" },
      { id: secondBranchId, name: "Manila South" },
    ];
    const { rerender } = renderInventory({
      branchOptions,
      selectedBranchId: branchId,
    });
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
        search="Flour"
        canAdjust
        canViewCommissary
        canViewBranch
        adjustAction={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "Branch" }).textContent,
    ).toContain("Manila South");
  });

  it("uses a client GET form and applies the selected branch with the existing search", async () => {
    const user = userEvent.setup();
    renderInventory({
      branchOptions: [
        { id: branchId, name: "Manila North" },
        { id: secondBranchId, name: "Manila South" },
      ],
      selectedBranchId: branchId,
      search: "Flour",
    });

    const form = screen.getByRole("form", { name: "Filter inventory" });
    expect(form.getAttribute("action")).toBe("/inventory");
    expect(form.getAttribute("method")).toBeNull();
    expect(
      screen
        .getByRole("combobox", { name: "Branch" })
        .getAttribute("data-slot"),
    ).toBe("select-trigger");

    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(
      await screen.findByRole("option", { name: "Manila South" }),
    );

    expect(
      form.querySelector('input[name="scope"]')?.getAttribute("value"),
    ).toBe("BRANCH");
    expect(
      form.querySelector('input[name="branch_id"]')?.getAttribute("value"),
    ).toBe(secondBranchId);
    expect(
      (screen.getByLabelText("Search stock items") as HTMLInputElement).value,
    ).toBe("Flour");
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

    expect(screen.getByText("No stock items match this search.")).toBeTruthy();
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
