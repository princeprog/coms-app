import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";
import {
  createStockRequestAction,
  transitionStockRequestAction,
} from "./stock-request-actions";

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
const requestDetail = {
  id,
  branch_id: id,
  branch_name: "Downtown",
  requested_by_user_id: id,
  requester_name: "Branch Manager",
  status: "PENDING",
  created_at: timestamp,
  updated_at: timestamp,
  items: [],
  events: [],
};

describe("stock request actions", () => {
  beforeEach(() => {
    requestComsApi.mockReset();
    revalidatePath.mockReset();
  });

  it("submits a validated request with a retry key and revalidates its routes", async () => {
    requestComsApi.mockResolvedValue(requestDetail);
    const input = {
      branch_id: id,
      items: [{ stock_item_id: id, quantity_requested: "2.5" }],
    };
    await expect(
      createStockRequestAction(input, idempotencyKey),
    ).resolves.toEqual({ ok: true, request_id: id });
    expect(requestComsApi).toHaveBeenCalledWith("/stock-requests", {
      cookieHeader: "coms_access=access-token",
      method: "POST",
      body: input,
      headers: { "Idempotency-Key": idempotencyKey },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/replenishment");
    expect(revalidatePath).toHaveBeenCalledWith(`/replenishment/${id}`);
  });

  it("does not call the API for invalid input or identifiers", async () => {
    await expect(
      createStockRequestAction(
        {
          branch_id: id,
          items: [{ stock_item_id: id, quantity_requested: "0" }],
        },
        idempotencyKey,
      ),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      transitionStockRequestAction("bad-id", "approve"),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      transitionStockRequestAction(id, "remove" as never),
    ).resolves.toMatchObject({ ok: false });
    expect(requestComsApi).not.toHaveBeenCalled();
  });

  it("uses explicit transition endpoints and validates returned state", async () => {
    requestComsApi.mockResolvedValue({ ...requestDetail, status: "APPROVED" });
    await expect(transitionStockRequestAction(id, "approve")).resolves.toEqual({
      ok: true,
    });
    expect(requestComsApi).toHaveBeenCalledWith(
      `/stock-requests/${id}/approve`,
      {
        cookieHeader: "coms_access=access-token",
        method: "POST",
      },
    );

    requestComsApi.mockResolvedValue({ ...requestDetail, status: "PENDING" });
    await expect(
      transitionStockRequestAction(id, "reject"),
    ).resolves.toMatchObject({ ok: false });
  });

  it("returns a useful conflict message for stale transitions", async () => {
    requestComsApi.mockRejectedValue(
      new ApiRequestError("State changed.", 409),
    );
    await expect(
      transitionStockRequestAction(id, "cancel"),
    ).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining("no longer pending"),
    });
  });
});
