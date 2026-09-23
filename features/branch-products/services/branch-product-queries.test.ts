import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";
import {
  getActiveProductOptions,
  getBranchOptions,
  getBranchProductPageData,
} from "./branch-product-queries";

const { cookies, requestComsApi, getBranchPageData, getProductPageData } =
  vi.hoisted(() => ({
    cookies: vi.fn(),
    requestComsApi: vi.fn(),
    getBranchPageData: vi.fn(),
    getProductPageData: vi.fn(),
  }));

vi.mock("next/headers", () => ({ cookies }));
vi.mock("server-only", () => ({}));
vi.mock("@/services/server-api-services", () => ({ requestComsApi }));
vi.mock("@/features/branches/services/branch-queries", () => ({
  getBranchPageData,
}));
vi.mock("@/features/products/services/product-queries", () => ({
  getProductPageData,
}));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
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

function branchPage(
  page: number,
  total: number,
  items: unknown[],
  page_size = 25,
) {
  return { items, total, page, page_size };
}

function productPage(
  page: number,
  total: number,
  items: unknown[],
  page_size = 25,
) {
  return { items, total, page, page_size };
}

describe("branch product queries", () => {
  beforeEach(() => {
    cookies
      .mockReset()
      .mockResolvedValue({ toString: () => "coms_access=abc" });
    requestComsApi.mockReset().mockResolvedValue({
      items: [offer],
      total: 1,
      page: 1,
      page_size: 25,
    });
    getBranchPageData.mockReset().mockResolvedValue(
      branchPage(1, 1, [
        {
          id: branchId,
          code: "DTN",
          branch_name: "Downtown",
          address: null,
          date_opened: null,
          has_dine_in: true,
          status: "active",
        },
      ]),
    );
    getProductPageData.mockReset().mockResolvedValue(
      productPage(1, 1, [
        {
          id: productId,
          product_name: "Chicken sandwich",
          description: null,
          is_active: true,
          created_at: timestamp,
          updated_at: timestamp,
        },
      ]),
    );
  });

  it("validates branch offer pages and encodes exact API filters", async () => {
    await expect(
      getBranchProductPageData({
        branchId,
        page: 2,
        search: "chicken & egg",
        isAvailable: false,
      }),
    ).resolves.toMatchObject({ items: [{ price: "125.0000" }] });
    expect(requestComsApi).toHaveBeenCalledWith(
      `/branches/${branchId}/products?page=2&page_size=25&search=chicken+%26+egg&is_available=false`,
      { cookieHeader: "coms_access=abc" },
    );

    requestComsApi.mockResolvedValueOnce({ items: [], total: "bad" });
    await expect(
      getBranchProductPageData({ branchId, page: 1, search: "" }),
    ).rejects.toBeInstanceOf(ApiRequestError);
  });

  it("loads every page of branches and active product choices", async () => {
    getBranchPageData
      .mockResolvedValueOnce(
        branchPage(
          1,
          2,
          [
            {
              id: branchId,
              code: "DTN",
              branch_name: "Downtown",
              address: null,
              date_opened: null,
              has_dine_in: true,
              status: "active",
            },
          ],
          1,
        ),
      )
      .mockResolvedValueOnce(
        branchPage(
          2,
          2,
          [
            {
              id: productId,
              code: "AIR",
              branch_name: "Airport",
              address: null,
              date_opened: null,
              has_dine_in: false,
              status: "inactive",
            },
          ],
          1,
        ),
      );
    getProductPageData
      .mockResolvedValueOnce(
        productPage(
          1,
          2,
          [
            {
              id: branchId,
              product_name: "Chicken sandwich",
            },
          ],
          1,
        ),
      )
      .mockResolvedValueOnce(
        productPage(
          2,
          2,
          [
            {
              id: productId,
              product_name: "Iced tea",
            },
          ],
          1,
        ),
      );

    await expect(getBranchOptions()).resolves.toEqual([
      { id: branchId, name: "Downtown", status: "active" },
      { id: productId, name: "Airport", status: "inactive" },
    ]);
    await expect(getActiveProductOptions()).resolves.toEqual([
      { id: branchId, product_name: "Chicken sandwich" },
      { id: productId, product_name: "Iced tea" },
    ]);
    expect(getBranchPageData).toHaveBeenNthCalledWith(1, 1);
    expect(getBranchPageData).toHaveBeenNthCalledWith(2, 2);
    expect(getProductPageData).toHaveBeenNthCalledWith(1, {
      page: 1,
      search: "",
      active: true,
    });
    expect(getProductPageData).toHaveBeenNthCalledWith(2, {
      page: 2,
      search: "",
      active: true,
    });
  });
});
