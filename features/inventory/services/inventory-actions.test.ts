import { beforeEach, describe, expect, it, vi } from "vitest";
import { adjustInventoryAction } from "./inventory-actions";

const { requestComsApi, revalidatePath } = vi.hoisted(() => ({
  requestComsApi: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "coms_access=access-token" }),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/services/server-api-services", () => ({ requestComsApi }));

const itemId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const idempotencyKey = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";

describe("inventory adjustment actions", () => {
  beforeEach(() => {
    requestComsApi.mockReset();
    revalidatePath.mockReset();
  });

  it("sends an idempotent branch adjustment and refreshes inventory", async () => {
    requestComsApi.mockResolvedValue({
      id: itemId,
      inventory_scope: "BRANCH",
      branch_id: itemId,
      stock_item_id: itemId,
      stock_item_name: "Flour",
      unit: "kg",
      movement_type: "ADJUSTMENT",
      quantity_delta: "1.25",
      reason: "Count correction",
      actor_user_id: itemId,
      idempotency_key: idempotencyKey,
      created_at: "2026-09-24T01:30:00.000Z",
    });

    await expect(
      adjustInventoryAction(
        {
          stock_item_id: itemId,
          quantity_delta: "1.25",
          reason: "Count correction",
        },
        { scope: "BRANCH", branch_id: itemId },
        idempotencyKey,
      ),
    ).resolves.toEqual({ ok: true });

    expect(requestComsApi).toHaveBeenCalledWith(
      `/inventory/branches/${itemId}/adjustments`,
      {
        cookieHeader: "coms_access=access-token",
        method: "POST",
        body: {
          stock_item_id: itemId,
          quantity_delta: "1.25",
          reason: "Count correction",
        },
        headers: { "Idempotency-Key": idempotencyKey },
      },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/inventory");
  });

  it("rejects invalid input before sending a request", async () => {
    await expect(
      adjustInventoryAction(
        {
          stock_item_id: itemId,
          quantity_delta: "0",
          reason: "Count correction",
        },
        { scope: "COMMISSARY" },
        idempotencyKey,
      ),
    ).resolves.toMatchObject({ ok: false });
    expect(requestComsApi).not.toHaveBeenCalled();
  });
});
