// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  BranchProductMutationResult,
  BranchProductOperationAction,
  BranchProductPage,
} from "@/features/branch-products/types/branch-product.types";
import { BranchProductList } from "./branch-product-list";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const timestamp = "2026-09-24T01:30:00.000Z";
const page: BranchProductPage = {
  items: [
    {
      branch_id: branchId,
      product_id: productId,
      product_name: "Chicken sandwich",
      description: "Grilled chicken on sourdough",
      product_is_active: true,
      price: "125.0000",
      is_available: false,
      created_at: timestamp,
      updated_at: timestamp,
    },
  ],
  total: 26,
  page: 1,
  page_size: 25,
};

const action = vi.fn<BranchProductOperationAction>().mockResolvedValue({
  ok: true,
} satisfies BranchProductMutationResult);

describe("branch product list", () => {
  it("shows exact price, availability, and filter-preserving pagination", () => {
    render(
      <BranchProductList
        page={page}
        branchId={branchId}
        branchName="Downtown"
        search="chicken"
        isAvailable={false}
        canUpdatePrice={false}
        canUpdateAvailability={false}
        priceAction={action}
        availabilityAction={action}
      />,
    );

    expect(
      screen.getByRole("table", { name: "Products offered at Downtown" }),
    ).toBeTruthy();
    expect(screen.getByText("Chicken sandwich")).toBeTruthy();
    expect(screen.getByText("125.0000")).toBeTruthy();
    expect(screen.getByText("Not available")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe(
      `/branch-products?branch_id=${branchId}&page=2&search=chicken&is_available=false`,
    );
  });

  it("explains an empty branch catalog and links to product management", () => {
    render(
      <BranchProductList
        page={{ ...page, items: [], total: 0 }}
        branchId={branchId}
        branchName="Downtown"
        search=""
        canUpdatePrice={false}
        canUpdateAvailability={false}
        priceAction={action}
        availabilityAction={action}
      />,
    );

    expect(
      screen.getByText("No products are offered at Downtown yet."),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Open products" }).getAttribute("href"),
    ).toBe("/products");
  });
});
