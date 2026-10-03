import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchDispatchStock } from "./dispatch-stock-actions";
const { getCurrentUserFromServer, requestComsApi } = vi.hoisted(() => ({
  getCurrentUserFromServer: vi.fn(),
  requestComsApi: vi.fn(),
}));
vi.mock("@/features/auth/services/auth-server", () => ({
  getCurrentUserFromServer,
}));
vi.mock("@/services/server-api-services", () => ({ requestComsApi }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "session" }),
}));
const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const stock = {
  id,
  stock_item_name: "Flour",
  unit: "kg",
  category: "Dry goods",
  is_active: true,
  created_at: "2026-09-25T01:00:00.000Z",
  updated_at: "2026-09-25T01:00:00.000Z",
};
const user = (extra: string[]) => ({
  status: "authenticated",
  user: {
    role: { isSystem: false, isActive: true, code: "MANAGER" },
    permissions: ["dispatches.create", "dispatches.dispatch", ...extra],
  },
});
describe("dispatch stock availability authorization", () => {
  beforeEach(() => {
    requestComsApi.mockReset();
    getCurrentUserFromServer.mockReset();
  });
  it("uses bounded catalog search without exposing balances when inventory read is missing", async () => {
    getCurrentUserFromServer.mockResolvedValue(user(["stock_items.read"]));
    requestComsApi.mockResolvedValue({
      items: [stock],
      total: 1,
      page: 1,
      page_size: 25,
    });
    const result = await searchDispatchStock({ search: "Flo", page: 1 });
    expect(result.items[0].quantity_on_hand).toBeNull();
    expect(requestComsApi).toHaveBeenCalledWith(
      "/stock-items?search=Flo&page=1&page_size=25&is_active=true",
      { cookieHeader: "session" },
    );
  });
  it("uses the existing inventory query contract for authorized availability", async () => {
    getCurrentUserFromServer.mockResolvedValue(
      user(["inventory.commissary_read"]),
    );
    requestComsApi.mockResolvedValue({
      items: [{ ...stock, quantity_on_hand: "12.125" }],
      total: 1,
      page: 1,
      page_size: 25,
    });
    expect(
      (await searchDispatchStock({ search: "", page: 1 })).items[0]
        .quantity_on_hand,
    ).toBe("12.125");
    expect(requestComsApi).toHaveBeenCalledWith(
      "/inventory/commissary?search=&page=1&page_size=25",
      { cookieHeader: "session" },
    );
  });
  it("does not call either catalog when creation or sending access is missing", async () => {
    getCurrentUserFromServer.mockResolvedValue({
      status: "authenticated",
      user: { role: null, permissions: [] },
    });
    await expect(searchDispatchStock({ search: "", page: 1 })).rejects.toThrow(
      /permissions/,
    );
    expect(requestComsApi).not.toHaveBeenCalled();
  });
});
