// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StockRequestCreateDialog } from "./stock-request-create-dialog";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const otherId = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const timestamp = "2026-09-24T01:30:00.000Z";
const branches = [
  {
    id,
    code: "DT",
    branch_name: "Downtown",
    address: null,
    date_opened: null,
    has_dine_in: false,
    status: "active" as const,
  },
  {
    id: otherId,
    code: "UP",
    branch_name: "Uptown",
    address: null,
    date_opened: null,
    has_dine_in: false,
    status: "active" as const,
  },
];
const stockItems = [
  {
    id,
    stock_item_name: "Flour",
    category: "Dry goods",
    unit: "kg",
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  },
  {
    id: otherId,
    stock_item_name: "Rice",
    category: "Dry goods",
    unit: "kg",
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  },
];

describe("stock request create sheet", () => {
  it("marks its portal, uses shadcn selects, and confirms dirty draft dismissal", async () => {
    const user = userEvent.setup();
    render(
      <StockRequestCreateDialog
        branches={branches}
        stockItems={stockItems}
        selectedBranchId={id}
        action={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "New stock request" }));
    expect(screen.getByRole("dialog").getAttribute("data-coms-ui")).toBe(
      "operational",
    );
    expect(
      screen
        .getByRole("combobox", { name: "Branch" })
        .getAttribute("data-slot"),
    ).toBe("select-trigger");
    expect(
      screen
        .getByRole("combobox", { name: "Stock item for line 1" })
        .getAttribute("data-slot"),
    ).toBe("select-trigger");
    await user.click(screen.getByRole("button", { name: "Add stock item" }));
    expect(
      screen.getByRole("combobox", { name: "Stock item for line 2" })
        .textContent,
    ).toContain("Rice (kg)");

    await user.type(screen.getByLabelText("Quantity 1"), "2.75");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.getByRole("alertdialog", { name: "Discard stock request?" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText("Quantity 1")).toHaveProperty("value", "2.75");
  });
});
