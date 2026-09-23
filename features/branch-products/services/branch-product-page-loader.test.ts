import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/features/auth/types/auth.types";
import { ApiRequestError } from "@/services/api-services";
import { loadBranchProductsView } from "./branch-product-page-loader";

const { getBranchProductPageData, getBranchOptions, getActiveProductOptions } =
  vi.hoisted(() => ({
    getBranchProductPageData: vi.fn(),
    getBranchOptions: vi.fn(),
    getActiveProductOptions: vi.fn(),
  }));

vi.mock("server-only", () => ({}));
vi.mock("./branch-product-queries", () => ({
  getBranchProductPageData,
  getBranchOptions,
  getActiveProductOptions,
}));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const otherBranchId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const timestamp = "2026-09-24T01:30:00.000Z";
const offer = {
  branch_id: branchId,
  product_id: productId,
  product_name: "Chicken sandwich",
  description: null,
  product_is_active: true,
  price: "125.0000",
  is_available: true,
  created_at: timestamp,
  updated_at: timestamp,
};
const page = { items: [offer], total: 1, page: 1, page_size: 25 };

function user(
  permissions: string[],
  branchIds: string[] = [branchId],
  role: User["role"] = {
    id: "1",
    code: "BRANCH_MANAGER",
    name: "Branch Manager",
    isSystem: false,
    isActive: true,
  },
): User {
  return {
    id: productId,
    email: "manager@example.com",
    full_name: "Branch Manager",
    contact_number: "",
    role,
    permissions,
    branch_ids: branchIds,
  };
}

describe("branch product page loader", () => {
  beforeEach(() => {
    getBranchProductPageData.mockReset().mockResolvedValue(page);
    getBranchOptions.mockReset().mockResolvedValue([
      { id: branchId, name: "Downtown", status: "active" },
      { id: otherBranchId, name: "Airport", status: "inactive" },
    ]);
    getActiveProductOptions
      .mockReset()
      .mockResolvedValue([{ id: productId, product_name: "Chicken sandwich" }]);
  });

  it("denies the page without branch_products.read", async () => {
    await expect(loadBranchProductsView(user([], []), {})).resolves.toEqual({
      status: "forbidden",
    });
    expect(getBranchProductPageData).not.toHaveBeenCalled();
  });

  it("loads assigned branch offers with exact URL filters and separate grants", async () => {
    await expect(
      loadBranchProductsView(
        user([
          "branch_products.read",
          "branch_products.create",
          "branch_products.update",
          "branch_products.availability_update",
          "products.read",
        ]),
        { search: " chicken ", is_available: "false" },
      ),
    ).resolves.toMatchObject({
      status: "ready",
      page,
      selectedBranch: {
        id: branchId,
        name: "Assigned branch",
        status: "unknown",
      },
      filters: { page: 1, search: "chicken", isAvailable: false },
      canCreate: true,
      canUpdatePrice: true,
      canUpdateAvailability: true,
      productOptions: [{ id: productId, product_name: "Chicken sandwich" }],
    });
    expect(getBranchProductPageData).toHaveBeenCalledWith({
      branchId,
      page: 1,
      search: "chicken",
      isAvailable: false,
    });
    expect(getActiveProductOptions).toHaveBeenCalledOnce();
    expect(getBranchOptions).not.toHaveBeenCalled();
  });

  it("rejects a requested branch outside the user's assignments", async () => {
    await expect(
      loadBranchProductsView(user(["branch_products.read"], [branchId]), {
        branch_id: otherBranchId,
      }),
    ).resolves.toEqual({ status: "forbidden" });
    expect(getBranchProductPageData).not.toHaveBeenCalled();
  });

  it("allows the protected Super Admin branch bypass and exposes all branches", async () => {
    const admin = user([], [], {
      id: "1",
      code: "SUPER_ADMIN",
      name: "Super Admin",
      isSystem: true,
      isActive: true,
    });
    await expect(
      loadBranchProductsView(admin, { branch_id: otherBranchId }),
    ).resolves.toMatchObject({
      status: "ready",
      selectedBranch: {
        id: otherBranchId,
        name: "Airport",
        status: "inactive",
      },
      canCreate: false,
      canUpdatePrice: false,
      canUpdateAvailability: false,
    });
    expect(getBranchOptions).toHaveBeenCalledOnce();
    expect(getBranchProductPageData).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: otherBranchId }),
    );
    expect(getActiveProductOptions).not.toHaveBeenCalled();
  });

  it("keeps inactive branch history readable but blocks configuration writes", async () => {
    getBranchOptions.mockResolvedValue([
      { id: branchId, name: "Closed branch", status: "inactive" },
    ]);
    await expect(
      loadBranchProductsView(
        user(
          [
            "branch_products.read",
            "branch_products.create",
            "branch_products.update",
            "branch_products.availability_update",
            "branches.read",
            "products.read",
          ],
          [branchId],
        ),
        {},
      ),
    ).resolves.toMatchObject({
      status: "ready",
      canCreate: false,
      canUpdatePrice: false,
      canUpdateAvailability: false,
    });
    expect(getBranchProductPageData).toHaveBeenCalledOnce();
  });

  it("maps expired API sessions and out-of-range pages", async () => {
    getBranchProductPageData.mockRejectedValueOnce(
      new ApiRequestError("expired", 401),
    );
    await expect(
      loadBranchProductsView(user(["branch_products.read"]), {}),
    ).resolves.toEqual({ status: "session-expired" });

    getBranchProductPageData.mockResolvedValueOnce({ ...page, page: 5 });
    await expect(
      loadBranchProductsView(user(["branch_products.read"]), {
        page: "5",
        search: "chicken",
      }),
    ).resolves.toEqual({
      status: "redirect",
      href: `/branch-products?branch_id=${branchId}&search=chicken`,
    });
  });

  it("preserves branch filters when the branch or offer list is unavailable", async () => {
    getBranchProductPageData.mockRejectedValueOnce(
      new ApiRequestError("missing", 404),
    );
    await expect(
      loadBranchProductsView(user(["branch_products.read"]), {
        search: "chicken",
      }),
    ).resolves.toEqual({
      status: "branch-unavailable",
      branchOptions: [
        { id: branchId, name: "Assigned branch", status: "unknown" },
      ],
      filters: { page: 1, search: "chicken" },
      message: "This branch is no longer available. Choose another branch.",
    });

    getBranchProductPageData.mockRejectedValueOnce(
      new ApiRequestError("unavailable", 503),
    );
    await expect(
      loadBranchProductsView(user(["branch_products.read"]), {
        search: "chicken",
      }),
    ).resolves.toMatchObject({
      status: "branch-products-error",
      selectedBranch: { id: branchId },
      filters: { page: 1, search: "chicken" },
    });
  });
});
