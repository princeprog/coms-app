// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BranchProductCreateAction } from "@/features/branch-products/components/branch-product-create-form";
import type { BranchProductOperationAction } from "@/features/branch-products/types/branch-product.types";
import { BranchProductsManagement } from "./branch-products-management";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const timestamp = "2026-09-24T01:30:00.000Z";
const branchOptions = [
  { id: branchId, name: "Downtown", status: "active" as const },
];
const page = {
  items: [
    {
      branch_id: branchId,
      product_id: productId,
      product_name: "Chicken sandwich",
      description: null,
      product_is_active: true,
      price: "125.00",
      is_available: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
  ],
  total: 1,
  page: 1,
  page_size: 25,
};

const createAction = vi.fn<BranchProductCreateAction>().mockResolvedValue({
  ok: true,
});
const operationAction = vi
  .fn<BranchProductOperationAction>()
  .mockResolvedValue({
    ok: true,
  });

describe("branch products management", () => {
  it("shows branch filters, offer setup, and current offers", () => {
    render(
      <BranchProductsManagement
        branchOptions={branchOptions}
        selectedBranch={branchOptions[0]}
        filters={{ page: 1, search: "", requestedBranchId: branchId }}
        page={page}
        productOptions={[{ id: productId, product_name: "Chicken sandwich" }]}
        productOptionsUnavailable={false}
        canCreate
        canUpdatePrice={false}
        canUpdateAvailability={false}
        createAction={createAction}
        priceAction={operationAction}
        availabilityAction={operationAction}
      />,
    );

    expect(screen.getByText(/configure branch-specific prices/i)).toBeTruthy();
    expect(screen.getByLabelText("Branch")).toBeTruthy();
    expect(screen.getByText("Add a product offer")).toBeTruthy();
    expect(screen.getByText("Products offered at Downtown")).toBeTruthy();
    expect(screen.getAllByText("Chicken sandwich")).toHaveLength(2);
  });

  it("keeps unavailable branch history accessible and reports the recovery path", () => {
    render(
      <BranchProductsManagement
        branchOptions={branchOptions}
        filters={{ page: 1, search: "", requestedBranchId: branchId }}
        page={null}
        productOptions={[]}
        productOptionsUnavailable={false}
        canCreate={false}
        canUpdatePrice={false}
        canUpdateAvailability={false}
        errorMessage="This branch is no longer available. Choose another branch."
        createAction={createAction}
        priceAction={operationAction}
        availabilityAction={operationAction}
      />,
    );

    expect(screen.getByRole("alert").textContent).toMatch(
      /choose another branch/i,
    );
    expect(screen.getByLabelText("Branch")).toBeTruthy();
    expect(screen.queryByText("Add a product offer")).toBeNull();
  });
});
