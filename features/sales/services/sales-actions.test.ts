import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";
import { createSaleAction, voidSaleAction } from "./sales-actions";

const { cookies, getCurrentUserFromServer, requestComsApi, revalidatePath } =
  vi.hoisted(() => ({
    cookies: vi.fn(),
    getCurrentUserFromServer: vi.fn(),
    requestComsApi: vi.fn(),
    revalidatePath: vi.fn(),
  }));

vi.mock("next/headers", () => ({ cookies }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/features/auth/services/auth-server", () => ({
  getCurrentUserFromServer,
}));
vi.mock("@/services/server-api-services", () => ({ requestComsApi }));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const saleId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const idempotencyKey = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const timestamp = "2026-09-24T01:30:00.000Z";
const sale = {
  id: saleId,
  branch_id: branchId,
  cashier_user_id: branchId,
  status: "COMPLETED",
  tender_method: "cash",
  total_amount: "12.50",
  idempotency_key: idempotencyKey,
  created_at: timestamp,
  items: [
    {
      id: productId,
      product_id: productId,
      product_name_snapshot: "Chicken sandwich",
      quantity: "1",
      unit_price: "12.50",
      line_total: "12.50",
      created_at: timestamp,
    },
  ],
  events: [
    {
      id: productId,
      event_type: "COMPLETED",
      actor_user_id: branchId,
      reason: null,
      created_at: timestamp,
    },
  ],
};

function session(permissions: string[], branchIds: string[] = [branchId]) {
  return {
    status: "authenticated",
    user: {
      id: branchId,
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
    },
  };
}

describe("sales actions", () => {
  beforeEach(() => {
    cookies.mockReset().mockResolvedValue({
      toString: () => "coms_access=access-token; coms_refresh=refresh",
    });
    getCurrentUserFromServer
      .mockReset()
      .mockResolvedValue(session(["sales.create", "sales.void"]));
    requestComsApi.mockReset().mockResolvedValue(sale);
    revalidatePath.mockReset();
  });

  it("posts validated sale data with branch authorization and an idempotency key", async () => {
    const input = {
      tender_method: "cash",
      items: [{ product_id: productId, quantity: "1.00" }],
    };
    await expect(
      createSaleAction(branchId, input, idempotencyKey),
    ).resolves.toMatchObject({ ok: true, sale: { id: saleId } });
    expect(requestComsApi).toHaveBeenCalledWith(`/branches/${branchId}/sales`, {
      cookieHeader: "coms_access=access-token; coms_refresh=refresh",
      method: "POST",
      body: input,
      headers: { "Idempotency-Key": idempotencyKey },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/pos");
  });

  it("rejects invalid requests, missing grants, and out-of-scope branches before API access", async () => {
    await expect(
      createSaleAction("bad-id", {}, idempotencyKey),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      createSaleAction(
        branchId,
        { tender_method: "cash", total_amount: "1", items: [] },
        "bad-key",
      ),
    ).resolves.toMatchObject({ ok: false });

    getCurrentUserFromServer.mockResolvedValueOnce(session([]));
    await expect(
      createSaleAction(
        branchId,
        {
          tender_method: "cash",
          items: [{ product_id: productId, quantity: "1" }],
        },
        idempotencyKey,
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining("sales"),
    });

    getCurrentUserFromServer.mockResolvedValueOnce(
      session(["sales.create"], []),
    );
    await expect(
      createSaleAction(
        branchId,
        {
          tender_method: "cash",
          items: [{ product_id: productId, quantity: "1" }],
        },
        idempotencyKey,
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining("branch"),
    });
    expect(requestComsApi).not.toHaveBeenCalled();
  });

  it("voids only with its permission and validates a voided response", async () => {
    requestComsApi.mockResolvedValueOnce({ ...sale, status: "VOIDED" });
    await expect(
      voidSaleAction(
        branchId,
        saleId,
        { reason: "Wrong item" },
        idempotencyKey,
      ),
    ).resolves.toEqual({ ok: true });
    expect(requestComsApi).toHaveBeenCalledWith(
      `/branches/${branchId}/sales/${saleId}/void`,
      {
        cookieHeader: "coms_access=access-token; coms_refresh=refresh",
        method: "POST",
        body: { reason: "Wrong item" },
        headers: { "Idempotency-Key": idempotencyKey },
      },
    );

    getCurrentUserFromServer.mockResolvedValueOnce(session(["sales.create"]));
    await expect(
      voidSaleAction(
        branchId,
        saleId,
        { reason: "Wrong item" },
        idempotencyKey,
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining("void"),
    });
    expect(requestComsApi).toHaveBeenCalledTimes(1);
  });

  it("returns a safe conflict message for changed stock or a retried sale", async () => {
    requestComsApi.mockRejectedValueOnce(
      new ApiRequestError("Insufficient branch inventory", 409),
    );
    await expect(
      createSaleAction(
        branchId,
        {
          tender_method: "cash",
          items: [{ product_id: productId, quantity: "1" }],
        },
        idempotencyKey,
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining("Stock or product availability"),
    });
  });
});
