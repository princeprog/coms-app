import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";
import {
  closeDispatchShortageAction,
  createDispatchAction,
  sendDispatchAction,
  postDispatchAction,
  reportDispatchDiscrepancyAction,
  receiveDispatchAction,
  requestDispatchRecountAction,
} from "./dispatch-actions";

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
const dispatchDetail = {
  id,
  branch_id: id,
  branch_name: "Downtown",
  status: "DRAFT",
  created_by_user_id: id,
  created_by_name: "Commissary Staff",
  dispatched_by_user_id: null,
  dispatched_by_name: null,
  dispatched_at: null,
  created_at: timestamp,
  updated_at: timestamp,
  items: [],
  receipts: [],
  shortage_closures: [],
  events: [],
};

describe("dispatch actions", () => {
  it("sends to the atomic endpoint and accepts the original dispatch after receipt", async () => {
    const input = {
      branch_id: id,
      items: [{ stock_item_id: id, quantity_dispatched: "2.5" }],
    };
    requestComsApi.mockResolvedValue({
      ...dispatchDetail,
      status: "RECEIVED",
      dispatched_by_user_id: id,
      dispatched_by_name: "Commissary Staff",
      dispatched_at: timestamp,
    });
    expect(await sendDispatchAction(input, idempotencyKey)).toEqual({
      ok: true,
      dispatch_id: id,
    });
    expect(requestComsApi).toHaveBeenCalledWith("/dispatches/send", {
      cookieHeader: "coms_access=access-token",
      method: "POST",
      body: input,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  });
  beforeEach(() => {
    requestComsApi.mockReset();
    revalidatePath.mockReset();
  });

  it("creates a validated direct draft with the request idempotency key", async () => {
    requestComsApi.mockResolvedValue(dispatchDetail);

    const input = {
      branch_id: id,
      items: [{ stock_item_id: id, quantity_dispatched: "25.5" }],
    };
    await expect(createDispatchAction(input, idempotencyKey)).resolves.toEqual({
      ok: true,
      dispatch_id: id,
    });
    expect(requestComsApi).toHaveBeenCalledWith("/dispatches", {
      cookieHeader: "coms_access=access-token",
      method: "POST",
      body: input,
      headers: { "Idempotency-Key": idempotencyKey },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dispatches");
    expect(revalidatePath).not.toHaveBeenCalledWith(`/replenishment/${id}`);
  });

  it("posts a draft with an idempotency key and revalidates the dispatch", async () => {
    requestComsApi.mockResolvedValue({
      ...dispatchDetail,
      status: "IN_TRANSIT",
      dispatched_by_user_id: id,
      dispatched_by_name: "Commissary Staff",
      dispatched_at: timestamp,
    });

    await expect(postDispatchAction(id, idempotencyKey)).resolves.toEqual({
      ok: true,
    });
    expect(requestComsApi).toHaveBeenCalledWith(`/dispatches/${id}/dispatch`, {
      cookieHeader: "coms_access=access-token",
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/dispatches/${id}`);
  });

  it("sends positive partial receipt quantities as decimal strings", async () => {
    requestComsApi.mockResolvedValue({
      ...dispatchDetail,
      status: "PARTIALLY_RECEIVED",
    });
    const input = {
      items: [{ dispatch_item_id: id, quantity_received: "2.5000" }],
    };

    await expect(
      receiveDispatchAction(id, input, idempotencyKey),
    ).resolves.toEqual({ ok: true });
    expect(requestComsApi).toHaveBeenCalledWith(`/dispatches/${id}/receive`, {
      cookieHeader: "coms_access=access-token",
      method: "POST",
      body: input,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  });

  it("trims the shortage reason before sending it", async () => {
    requestComsApi.mockResolvedValue({
      ...dispatchDetail,
      status: "CLOSED_WITH_SHORTAGE",
    });
    await expect(
      closeDispatchShortageAction(
        id,
        {
          reason: "  Damaged in transit  ",
          items: [{ dispatch_item_id: id, quantity_closed: "2" }],
        },
        idempotencyKey,
      ),
    ).resolves.toEqual({ ok: true });
    expect(requestComsApi).toHaveBeenCalledWith(
      `/dispatches/${id}/shortage-closures`,
      {
        cookieHeader: "coms_access=access-token",
        method: "POST",
        body: {
          reason: "Damaged in transit",
          items: [{ dispatch_item_id: id, quantity_closed: "2" }],
        },
        headers: { "Idempotency-Key": idempotencyKey },
      },
    );
  });

  it("reports a receipt discrepancy with its note and idempotency key", async () => {
    requestComsApi.mockResolvedValue({ ...dispatchDetail, discrepancy: null });

    await expect(
      reportDispatchDiscrepancyAction(
        id,
        { note: "  20 units missing  " },
        idempotencyKey,
      ),
    ).resolves.toEqual({ ok: true });
    expect(requestComsApi).toHaveBeenCalledWith(
      `/dispatches/${id}/discrepancies`,
      {
        cookieHeader: "coms_access=access-token",
        method: "POST",
        body: { note: "20 units missing" },
        headers: { "Idempotency-Key": idempotencyKey },
      },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("requests a recount with its reason and idempotency key", async () => {
    requestComsApi.mockResolvedValue({ ...dispatchDetail, discrepancy: null });

    await expect(
      requestDispatchRecountAction(
        id,
        { reason: "  Confirm remaining stock  " },
        idempotencyKey,
      ),
    ).resolves.toEqual({ ok: true });
    expect(requestComsApi).toHaveBeenCalledWith(
      `/dispatches/${id}/discrepancies/recount`,
      {
        cookieHeader: "coms_access=access-token",
        method: "POST",
        body: { reason: "Confirm remaining stock" },
        headers: { "Idempotency-Key": idempotencyKey },
      },
    );
  });

  it("does not call the API when a discrepancy or recount note is empty", async () => {
    await expect(
      reportDispatchDiscrepancyAction(id, { note: "   " }, idempotencyKey),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      requestDispatchRecountAction(id, { reason: "   " }, idempotencyKey),
    ).resolves.toMatchObject({ ok: false });
    expect(requestComsApi).not.toHaveBeenCalled();
  });

  it("rejects invalid IDs, retry keys, and receipt data without calling the API", async () => {
    await expect(
      createDispatchAction({ branch_id: "bad-id", items: [] }, idempotencyKey),
    ).resolves.toMatchObject({ ok: false });
    await expect(postDispatchAction(id, "bad-key")).resolves.toMatchObject({
      ok: false,
    });
    await expect(
      receiveDispatchAction(
        id,
        { items: [{ dispatch_item_id: id, quantity_received: "0" }] },
        idempotencyKey,
      ),
    ).resolves.toMatchObject({ ok: false });
    expect(requestComsApi).not.toHaveBeenCalled();
  });

  it("returns a useful workflow conflict message", async () => {
    requestComsApi.mockRejectedValue(
      new ApiRequestError("Dispatch state changed.", 409),
    );
    await expect(postDispatchAction(id, idempotencyKey)).resolves.toMatchObject(
      {
        ok: false,
        error: expect.stringContaining("workflow changed"),
      },
    );
  });
});
