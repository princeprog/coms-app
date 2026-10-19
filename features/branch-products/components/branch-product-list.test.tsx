import { render } from "@/test/pos-render";
// @vitest-environment jsdom

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type {
  BranchProductMutationResult,
  BranchProductOperationAction,
  BranchProductPage,
} from "@/features/branch-products/types/branch-product.types";
import { BranchProductList } from "./branch-product-list";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/features/menus/services/menu-actions", () => ({
  submitMenuRequestAction: vi.fn(),
  updateMenuServicesAction: vi.fn(),
}));
vi.mock("@/features/menus/hooks/use-menu-lookup", () => ({
  useMenuLookup: () => ({
    data: { ok: true, options: [], total: 0, page: 1, page_size: 20 },
  }),
}));

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
      category_id: "aa000000-0000-4000-8000-000000000001",
      category_name: "Rice meals",
      category_is_active: true,
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
        canManage={false}
        availabilityAction={action}
      />,
    );

    expect(
      screen.getByRole("table", { name: "Branch menu for Downtown" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: "Branch menu items" }),
    ).toBeTruthy();
    expect(screen.getByText("Chicken sandwich")).toBeTruthy();
    expect(screen.getByText("₱125.00")).toBeTruthy();
    expect(screen.getByText("Unavailable")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe(
      `/branch-products?page_size=25&branch_id=${branchId}&page=2&search=chicken&is_available=false`,
    );
  });

  it("explains an empty branch catalog without suggesting an unauthorized action", () => {
    render(
      <BranchProductList
        page={{ ...page, items: [], total: 0 }}
        branchId={branchId}
        branchName="Downtown"
        search=""
        canManage={false}
        availabilityAction={action}
      />,
    );

    expect(
      screen.getByText("No products are on the menu at Downtown yet."),
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
        canManage={false}
        availabilityAction={action}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Clear filters" }).getAttribute("href"),
    ).toBe(`/branch-products?page_size=25&branch_id=${branchId}`);
  });

  it("keeps price and availability changes in separate dialogs", async () => {
    const user = userEvent.setup();
    render(
      <BranchProductList
        page={{ ...page, total: 1 }}
        branchId={branchId}
        branchName="Downtown"
        search=""
        canManage={true}
        availabilityAction={action}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Actions for Chicken sandwich" }),
    );
    const priceLink = await screen.findByRole("menuitem", {
      name: "Edit product",
    });
    expect(priceLink.getAttribute("href")).toContain(
      `/products/${productId}/setup`,
    );
    await user.click(screen.getByRole("menuitem", { name: "Make available" }));
    expect(
      await screen.findByRole("dialog", { name: "Change availability" }),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Price *")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Confirm change" }));
    expect(action).toHaveBeenCalledWith(branchId, productId, {
      is_available: true,
    });
  });

  it("shows only eligible services and preserves inactive and blocked explanations", () => {
    render(
      <BranchProductList
        page={{
          ...page,
          items: [
            {
              ...page.items[0],
              service_types: ["DINE_IN", "TAKEAWAY"],
              available_service_types: ["TAKEAWAY"],
            },
            {
              ...page.items[0],
              product_id: "3fa85f64-5717-4562-b3fc-2c963f66afa8",
              product_name: "Retired meal",
              category_id: "aa000000-0000-4000-8000-000000000001",
              category_name: "Rice meals",
              category_is_active: true,
              product_is_active: false,
              service_types: ["DINE_IN", "TAKEAWAY"],
              available_service_types: [],
              blocked_reason: "Inactive product",
            },
          ],
        }}
        branchId={branchId}
        branchName="Downtown"
        search=""
        canManage={false}
        availabilityAction={action}
      />,
    );
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).queryByText("Dine-in")).toBeNull();
    expect(within(rows[1]).getByText("Takeout")).toBeTruthy();
    expect(within(rows[2]).getByText("Inactive")).toBeTruthy();
    expect(within(rows[2]).getByText("No eligible services")).toBeTruthy();
    expect(within(rows[2]).queryByText("Takeout")).toBeNull();
  });

  it("preserves prices beyond JS precision and pagination service/sort context", () => {
    render(
      <BranchProductList
        page={{
          ...page,
          items: [{ ...page.items[0], price: "9007199254740993.1250" }],
          page: 2,
          total: 80,
        }}
        branchId={branchId}
        branchName="Downtown"
        search="chicken"
        isAvailable={false}
        serviceType="TAKEAWAY"
        sort="price:desc"
        canManage={false}
        availabilityAction={action}
      />,
    );
    expect(screen.getByText("₱9,007,199,254,740,993.125")).toBeTruthy();
    const params = new URL(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href")!,
      "http://localhost",
    ).searchParams;
    expect(Object.fromEntries(params)).toEqual({
      page_size: "25",
      branch_id: branchId,
      service_type: "TAKEAWAY",
      sort: "price:desc",
      page: "3",
      search: "chicken",
      is_available: "false",
    });
    expect(
      screen
        .getByRole("button", { name: "Page 2" })
        .getAttribute("aria-current"),
    ).toBe("page");
  });
});
