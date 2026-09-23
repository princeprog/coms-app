import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";
import { loadSalesView } from "./sales-page-loader";

const {
  getBranchOptions,
  getBranchProductPageData,
  getSaleDetailData,
  getSalePageData,
} = vi.hoisted(() => ({
  getBranchOptions: vi.fn(),
  getBranchProductPageData: vi.fn(),
  getSaleDetailData: vi.fn(),
  getSalePageData: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/branch-products/services/branch-product-queries", () => ({
  getBranchOptions,
  getBranchProductPageData,
}));
vi.mock("./sales-queries", () => ({ getSaleDetailData, getSalePageData }));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const otherBranchId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const saleId = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa9";
const timestamp = "2026-09-24T01:30:00.000Z";

function user(permissions: string[], branchIds: string[] = [branchId]) {
  return {
    id: saleId,
    email: "cashier@example.com",
    full_name: "Cashier",
    contact_number: "",
    role: {
      id: "1",
      code: "CASHIER",
      name: "Cashier",
      isSystem: false,
      isActive: true,
    },
    permissions,
    branch_ids: branchIds,
  };
}

const branches = [
  { id: branchId, name: "Downtown", status: "active" as const },
  { id: otherBranchId, name: "Airport", status: "active" as const },
];
const menuPage = {
  items: [
    {
      branch_id: branchId,
      branch_name: "Downtown",
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
const salesPage = {
  items: [],
  total: 0,
  page: 1,
  page_size: 25,
};

describe("POS page loader", () => {
  beforeEach(() => {
    getBranchOptions.mockReset().mockResolvedValue(branches);
    getBranchProductPageData.mockReset().mockResolvedValue(menuPage);
    getSalePageData.mockReset().mockResolvedValue(salesPage);
    getSaleDetailData.mockReset().mockResolvedValue({
      id: saleId,
      branch_id: branchId,
      cashier_user_id: saleId,
      status: "COMPLETED",
      tender_method: "cash",
      total_amount: "125.00",
      idempotency_key: productId,
      created_at: timestamp,
      items: [],
      events: [],
    });
  });

  it("denies users without a sales permission before loading branch data", async () => {
    await expect(loadSalesView(user([]), {})).resolves.toEqual({
      status: "forbidden",
    });
    expect(getBranchOptions).not.toHaveBeenCalled();
    expect(getSalePageData).not.toHaveBeenCalled();
  });

  it("filters branch choices to assigned branches and loads scoped POS data", async () => {
    await expect(
      loadSalesView(
        user([
          "sales.create",
          "sales.read",
          "branch_products.read",
          "branches.read",
        ]),
        { branch_id: otherBranchId, search: "chicken" },
      ),
    ).resolves.toEqual({ status: "forbidden" });
    expect(getBranchProductPageData).not.toHaveBeenCalled();

    const view = await loadSalesView(
      user([
        "sales.create",
        "sales.read",
        "branch_products.read",
        "branches.read",
      ]),
      { branch_id: branchId, search: "chicken" },
    );
    expect(view).toMatchObject({
      status: "ready",
      selectedBranch: branches[0],
      canCreate: true,
      canRead: true,
      menuPage,
      salesPage,
    });
    expect(getBranchProductPageData).toHaveBeenCalledWith({
      branchId,
      page: 1,
      search: "chicken",
      isAvailable: true,
    });
    expect(getSalePageData).toHaveBeenCalledWith({ branchId, page: 1 });
  });

  it("keeps sale history available when the menu read grant is missing", async () => {
    const view = await loadSalesView(user(["sales.create", "sales.read"]), {
      branch_id: branchId,
    });
    expect(view).toMatchObject({
      status: "ready",
      menuPage: null,
      menuIssue: "permissions",
      salesPage,
    });
    expect(getBranchProductPageData).not.toHaveBeenCalled();
  });

  it("returns the selected sale detail and reports unavailable history safely", async () => {
    const view = await loadSalesView(user(["sales.read", "sales.void"]), {
      branch_id: branchId,
      sale_id: saleId,
    });
    expect(view).toMatchObject({
      status: "ready",
      selectedSale: { id: saleId },
    });
    expect(getSaleDetailData).toHaveBeenCalledWith(branchId, saleId);

    getSalePageData.mockRejectedValueOnce(
      new ApiRequestError("unavailable", 503),
    );
    await expect(
      loadSalesView(user(["sales.read"]), { branch_id: branchId }),
    ).resolves.toMatchObject({ status: "ready", historyIssue: "unavailable" });
  });
});
