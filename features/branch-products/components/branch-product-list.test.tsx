// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    expect(
      screen.getByRole("region", { name: "Branch product offers" }),
    ).toBeTruthy();
    expect(screen.getByText("Chicken sandwich")).toBeTruthy();
    expect(screen.getByText("125.0000")).toBeTruthy();
    expect(screen.getByText("Not available")).toBeTruthy();
    expect(screen.getByText("Active product")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe(
      `/branch-products?branch_id=${branchId}&page=2&search=chicken&is_available=false`,
    );
  });

  it("explains an empty branch catalog without suggesting an unauthorized action", () => {
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
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("clears an empty result's filters while retaining its branch", () => {
    render(
      <BranchProductList
        page={{ ...page, items: [], total: 0 }}
        branchId={branchId}
        branchName="Downtown"
        search="missing"
        isAvailable={false}
        canUpdatePrice={false}
        canUpdateAvailability={false}
        priceAction={action}
        availabilityAction={action}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Clear filters" }).getAttribute("href"),
    ).toBe(`/branch-products?branch_id=${branchId}`);
  });

  it("keeps price and availability changes in separate dialogs", async () => {
    const user = userEvent.setup();
    render(
      <BranchProductList
        page={{ ...page, total: 1 }}
        branchId={branchId}
        branchName="Downtown"
        search=""
        canUpdatePrice
        canUpdateAvailability
        priceAction={action}
        availabilityAction={action}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Change price" }));
    expect(
      await screen.findByRole("dialog", { name: "Change price" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Price *")).toBeTruthy();
    expect(screen.queryByLabelText("Availability")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await user.click(
      screen.getByRole("button", { name: "Change availability" }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Change availability" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Availability")).toBeTruthy();
    expect(screen.queryByLabelText("Price *")).toBeNull();
  });
});
