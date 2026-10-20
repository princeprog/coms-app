import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";
import { loadSalesView } from "./sales-page-loader";

const {
  getBranchOptions,
  getBranchMenuCategories,
  getBranchProductPageData,
  getSaleDetailData,
  getSalePageData,
} = vi.hoisted(() => ({
  getBranchOptions: vi.fn(),
  getBranchMenuCategories: vi.fn(),
  getBranchProductPageData: vi.fn(),
  getSaleDetailData: vi.fn(),
  getSalePageData: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/branch-products/services/branch-product-queries", () => ({
  getBranchOptions,
  getBranchMenuCategories,
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
      category_id: "aa000000-0000-4000-8000-000000000001",
      category_name: "Rice meals",
      category_is_active: true,
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
  it("applies service eligibility on the backend before pagination", async () => {
    await loadSalesView(
      user(["sales.create", "branch_products.read", "branches.read"]),
      { service_type: "TAKEAWAY" },
    );
    expect(getBranchProductPageData).toHaveBeenCalledWith(
      expect.objectContaining({ serviceType: "TAKEAWAY", eligibleOnly: true }),
    );
  });
  beforeEach(() => {
    getBranchMenuCategories
      .mockReset()
      .mockResolvedValue([
        { id: "aa000000-0000-4000-8000-000000000001", name: "Rice meals" },
      ]);
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

  it("passes category to the server and loads options independently of search", async () => {
    const categoryId = "aa000000-0000-4000-8000-000000000001";
    const result = await loadSalesView(
      user(["sales.create", "branch_products.read", "branches.read"]),
      { category_id: categoryId, search: "adobo", service_type: "DINE_IN" },
    );
    expect(result).toMatchObject({
      status: "ready",
      categories: [{ id: categoryId, name: "Rice meals" }],
    });
    expect(getBranchProductPageData).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId,
        search: "adobo",
        eligibleOnly: true,
      }),
    );
    expect(getBranchMenuCategories).toHaveBeenCalledWith(branchId, "DINE_IN");
  });
  it("resets a stale category without losing the branch, service or search", async () => {
    const result = await loadSalesView(
      user(["sales.create", "branch_products.read", "branches.read"]),
      {
        branch_id: branchId,
        category_id: productId,
        search: "adobo",
        service_type: "DINE_IN",
        page: "3",
      },
    );
    expect(result).toMatchObject({ status: "redirect" });
    if (result.status !== "redirect") throw Error("Expected redirect");
    const query = new URL(result.href, "http://localhost").searchParams;
    expect(query.has("category_id")).toBe(false);
    expect(query.has("page")).toBe(false);
    expect(query.get("search")).toBe("adobo");
    expect(query.get("service_type")).toBe("DINE_IN");
  });
  it("preserves the menu when category loading fails without clearing the filter", async () => {
    getBranchMenuCategories.mockRejectedValue(
      new ApiRequestError("Unavailable", 503),
    );
    const result = await loadSalesView(
      user(["sales.create", "branch_products.read", "branches.read"]),
      { category_id: productId },
    );
    expect(result).toMatchObject({
      status: "ready",
      canCreate: true,
      menuPage,
      categoriesUnavailable: true,
      filters: { categoryId: productId },
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
      pageSize: 25,
      branchId,
      page: 1,
      search: "chicken",
      isAvailable: true,
      eligibleOnly: true,
    });
    expect(getSalePageData).toHaveBeenCalledWith(
      expect.objectContaining({
        branchId,
        page: 1,
        pageSize: 10,
        dateFrom: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        dateTo: expect.any(String),
      }),
    );
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
