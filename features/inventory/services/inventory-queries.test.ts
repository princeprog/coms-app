import { beforeEach, describe, expect, it, vi } from "vitest";
import { getInventoryPageData } from "./inventory-queries";

const { requestComsApi } = vi.hoisted(() => ({ requestComsApi: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "coms_access=access-token" }),
}));
vi.mock("@/services/server-api-services", () => ({ requestComsApi }));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const timestamp = "2026-09-24T01:30:00.000Z";

describe("inventory page queries", () => {
  beforeEach(() => requestComsApi.mockReset());

  it("loads branch balances and movements with the same validated filters", async () => {
    requestComsApi
      .mockResolvedValueOnce({
        items: [
          {
            id,
            stock_item_name: "Flour",
            category: "Dry goods",
            unit: "kg",
            is_active: true,
            created_at: timestamp,
            updated_at: timestamp,
            quantity_on_hand: "2.500",
          },
        ],
        total: 1,
        page: 2,
        page_size: 25,
      })
      .mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        page_size: 25,
      });

    await expect(
      getInventoryPageData({
        scope: "BRANCH",
        branchId: id,
        page: 2,
        search: " Flour ",
      }),
    ).resolves.toMatchObject({
      inventory: { total: 1 },
      movements: { total: 0 },
    });

    expect(requestComsApi).toHaveBeenNthCalledWith(
      1,
      `/inventory/branches/${id}?page=2&page_size=25&search=Flour`,
      { cookieHeader: "coms_access=access-token" },
    );
    expect(requestComsApi).toHaveBeenNthCalledWith(
      2,
      `/inventory/branches/${id}/movements?page=1&page_size=25`,
      { cookieHeader: "coms_access=access-token" },
    );
  });

  it("rejects an API response that does not match the inventory contract", async () => {
    requestComsApi.mockResolvedValue({ items: [], total: "one" });

    await expect(
      getInventoryPageData({
        scope: "COMMISSARY",
        page: 1,
        search: "",
      }),
    ).rejects.toMatchObject({ status: 502 });
  });
});
