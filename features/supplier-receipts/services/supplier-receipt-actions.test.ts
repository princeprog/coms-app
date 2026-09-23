import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";
import {
  createSupplierReceiptAction,
  postSupplierReceiptAction,
} from "./supplier-receipt-actions";

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

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const idempotencyKey = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const timestamp = "2026-09-24T01:30:00.000Z";
const receiptDetail = {
  id,
  supplier_id: id,
  supplier_name: "North Farm Supply",
  received_at: "2026-09-24",
  status: "DRAFT",
  idempotency_key: idempotencyKey,
  created_by_user_id: id,
  posted_by_user_id: null,
  posted_at: null,
  created_at: timestamp,
  updated_at: timestamp,
  total_cost: "33.125",
  items: [
    {
      id,
      stock_item_id: id,
      stock_item_name: "Flour",
      unit: "kg",
      quantity_received: "2.5",
      unit_cost: "13.25",
      line_total: "33.125",
    },
  ],
};

describe("supplier receipt actions", () => {
  beforeEach(() => {
    requestComsApi.mockReset();
    revalidatePath.mockReset();
  });

  it("creates a receipt with its idempotency key and revalidates the directory", async () => {
    requestComsApi.mockResolvedValue(receiptDetail);
    const input = {
      supplier_id: id,
      received_at: "2026-09-24",
      items: [
        { stock_item_id: id, quantity_received: "2.5", unit_cost: "13.25" },
      ],
    };

    await expect(
      createSupplierReceiptAction(input, idempotencyKey),
    ).resolves.toEqual({ ok: true, receipt_id: id });

    expect(requestComsApi).toHaveBeenCalledWith("/supplier-receipts", {
      cookieHeader: "coms_access=access-token",
      method: "POST",
      body: input,
      headers: { "Idempotency-Key": idempotencyKey },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/receipts");
  });

  it("reports a changed idempotency retry clearly", async () => {
    requestComsApi.mockRejectedValue(
      new ApiRequestError("Idempotency key conflict", 409),
    );

    await expect(
      createSupplierReceiptAction(
        {
          supplier_id: id,
          received_at: "2026-09-24",
          items: [
            { stock_item_id: id, quantity_received: "1", unit_cost: "1" },
          ],
        },
        idempotencyKey,
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining("different"),
    });
  });

  it("posts only a valid receipt ID", async () => {
    requestComsApi.mockResolvedValue({ ...receiptDetail, status: "POSTED" });

    await expect(postSupplierReceiptAction(id)).resolves.toEqual({ ok: true });
    expect(requestComsApi).toHaveBeenCalledWith(
      `/supplier-receipts/${id}/post`,
      {
        cookieHeader: "coms_access=access-token",
        method: "POST",
      },
    );

    await expect(postSupplierReceiptAction("invalid")).resolves.toMatchObject({
      ok: false,
    });
    expect(requestComsApi).toHaveBeenCalledTimes(1);
  });
});
