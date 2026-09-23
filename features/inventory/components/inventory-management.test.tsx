// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
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

  it("hides adjustment actions when not granted and for inactive stock", () => {
    renderInventory({ canAdjust: false });

    expect(screen.queryByRole("button", { name: "Adjust Flour" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Adjust Cooking oil" }),
    ).toBeNull();
    expect(screen.getByText("Inactive")).toBeTruthy();
  });

  it("hides adjustments for inactive branches while keeping their inventory visible", () => {
    renderInventory({
      branchOptions: [
        { id: branchId, name: "Manila North", status: "inactive" },
      ],
    });

    expect(
      screen.getByText(
        "Branch: Manila North (inactive; adjustments are disabled)",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Adjust Flour" })).toBeNull();
    expect(screen.getByText("2.500 kg")).toBeTruthy();
  });

  it("keeps commissary adjustments available when an assigned branch is inactive", () => {
    renderInventory({
      scope: "COMMISSARY",
      branchOptions: [
        { id: branchId, name: "Manila North", status: "inactive" },
      ],
    });

    expect(screen.getByRole("button", { name: "Adjust Flour" })).toBeTruthy();
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
    const branchSelect = screen.getByLabelText("Branch") as HTMLSelectElement;
    expect(branchSelect.value).toBe(branchId);

    rerender(
      <InventoryManagement
        inventory={inventory}
        movements={movements}
        scope="BRANCH"
        branchOptions={branchOptions}
        selectedBranchId={secondBranchId}
        search="Flour"
        canAdjust
        adjustAction={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Branch")).toHaveProperty(
      "value",
      secondBranchId,
    );
  });

  it("explains when there is no assigned branch", () => {
    renderInventory({
      inventory: null,
      movements: null,
      branchOptions: [],
      selectedBranchId: undefined,
      branchUnavailable: true,
    });
    expect(
      screen.getByText("No branch is assigned to this account."),
    ).toBeTruthy();
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
  });
});
