import { beforeEach, describe, it, expect, vi } from "vitest";
import { authTestSessionUser } from "@/test/auth-fixtures";
import {
  createPurchaseAction,
  getPurchaseDetail,
  searchPurchaseStock,
} from "./purchase-actions";
const { api, session, revalidate } = vi.hoisted(() => ({
  api: vi.fn(),
  session: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/services/server-api-services", () => ({ requestComsApi: api }));
vi.mock("@/features/auth/services/auth-server", () => ({
  getCurrentUserFromServer: session,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidate }));
const id = "10000000-0000-4000-8000-000000000001";
const input = {
  purchase_date: "2026-01-01",
  items: [{ stock_item_id: id, quantity_received: "2.5", unit_cost: "13.25" }],
};
const detail = {
  ...input,
  id,
  store_name: null,
  receipt_number: null,
  notes: null,
  total_cost: "33.125",
  recorded_at: "2026-10-20T12:00:00.000Z",
  recorded_by_name: "Receiver",
  items: [
    {
      ...input.items[0],
      id,
      stock_item_name: "Flour",
      unit: "kg",
      line_total: "33.125",
    },
  ],
};
describe("purchase server authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.mockResolvedValue({
      status: "authenticated",
      user: {
        ...authTestSessionUser,
        permissions: ["supplier_receipts.create", "stock_items.read"],
      },
    });
  });
  it("records without suppliers.read and relays the retry key", async () => {
    api.mockResolvedValue(detail);
    expect(await createPurchaseAction(input, id)).toEqual({
      ok: true,
      purchase_id: id,
    });
    expect(api).toHaveBeenCalledWith(
      "/direct-purchases",
      expect.objectContaining({
        headers: { "Idempotency-Key": id },
        body: input,
      }),
    );
    expect(revalidate).not.toHaveBeenCalled();
  });
  it("denies purchase costs to inventory-only readers before making a request", async () => {
    session.mockResolvedValue({
      status: "authenticated",
      user: {
        ...authTestSessionUser,
        permissions: ["inventory.commissary_read"],
      },
    });
    await expect(getPurchaseDetail(id)).rejects.toThrow("permission");
    expect((await createPurchaseAction(input, id)).ok).toBe(false);
    await expect(searchPurchaseStock({ search: "", page: 1 })).rejects.toThrow(
      "permission",
    );
    expect(api).not.toHaveBeenCalled();
  });
  it("requires stock read permission for catalog search", async () => {
    session.mockResolvedValue({
      status: "authenticated",
      user: {
        ...authTestSessionUser,
        permissions: ["supplier_receipts.create"],
      },
    });
    await expect(searchPurchaseStock({ search: "", page: 1 })).rejects.toThrow(
      "permission",
    );
    expect(api).not.toHaveBeenCalled();
  });
  it("rejects invalid input without a write", async () => {
    expect(
      (await createPurchaseAction({ ...input, branch_id: id }, id)).ok,
    ).toBe(false);
    expect(api).not.toHaveBeenCalled();
  });
  it("shows commissary balances only to roles that can read them", async () => {
    const stock = {
      id,
      stock_item_name: "Flour",
      category: "Dry goods",
      unit: "kg",
      is_active: true,
      created_at: "2026-10-01T00:00:00.000Z",
      updated_at: "2026-10-01T00:00:00.000Z",
    };
    api.mockResolvedValue({ items: [stock], total: 1, page: 1, page_size: 25 });
    const catalog = await searchPurchaseStock({ search: "Flo", page: 1 });
    expect(api).toHaveBeenLastCalledWith(
      expect.stringMatching(/^\/stock-items\?/),
      expect.anything(),
    );
    expect(catalog.items[0].quantity_on_hand).toBeNull();

    session.mockResolvedValue({
      status: "authenticated",
      user: {
        ...authTestSessionUser,
        permissions: ["supplier_receipts.create", "inventory.commissary_read"],
      },
    });
    api.mockResolvedValue({
      items: [{ ...stock, quantity_on_hand: "20.25" }],
      total: 1,
      page: 1,
      page_size: 25,
      available_categories: [],
    });
    const balances = await searchPurchaseStock({ search: "Flo", page: 1 });
    expect(api).toHaveBeenLastCalledWith(
      "/inventory/commissary?search=Flo&page=1&page_size=25&is_active=true",
      expect.anything(),
    );
    expect(balances.items[0].quantity_on_hand).toBe("20.25");
  });
});
