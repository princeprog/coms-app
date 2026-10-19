import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";
import {
  closeDispatchShortageAction,
  createDispatchAction,
  sendDispatchAction,
  postDispatchAction,
  receiveDispatchAction,
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
const sentDetail = {
  ...dispatchDetail,
  status: "IN_TRANSIT",
  dispatched_by_user_id: id,
  dispatched_by_name: "Commissary Staff",
  dispatched_at: timestamp,
  delivered_by_name: "Juan Dela Cruz",
};

describe("dispatch actions", () => {
  beforeEach(() => {
    requestComsApi.mockReset();
    revalidatePath.mockReset();
  });

  it("sends with the delivery name and accepts the original dispatch after receipt", async () => {
    const input = {
      branch_id: id,
      items: [{ stock_item_id: id, quantity_dispatched: "2.5" }],
      delivered_by_name: "Juan Dela Cruz",
    };
    requestComsApi.mockResolvedValue({ ...sentDetail, status: "RECEIVED" });
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

  it("does not send a dispatch without a delivery name", async () => {
    await expect(
      sendDispatchAction(
        {
          branch_id: id,
          items: [{ stock_item_id: id, quantity_dispatched: "2.5" }],
          delivered_by_name: "  ",
        },
        idempotencyKey,
      ),
    ).resolves.toMatchObject({ ok: false });
    expect(requestComsApi).not.toHaveBeenCalled();
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
  });

  it("sends a draft with the trimmed delivery name and revalidates the dispatch", async () => {
    requestComsApi.mockResolvedValue(sentDetail);

    await expect(
      postDispatchAction(
        id,
        { delivered_by_name: "  Juan Dela Cruz " },
        idempotencyKey,
      ),
    ).resolves.toEqual({ ok: true });
    expect(requestComsApi).toHaveBeenCalledWith(`/dispatches/${id}/dispatch`, {
      cookieHeader: "coms_access=access-token",
      method: "POST",
      body: { delivered_by_name: "Juan Dela Cruz" },
      headers: { "Idempotency-Key": idempotencyKey },
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/dispatches/${id}`);
  });

  it("submits a blind count with zero lines and a note", async () => {
    requestComsApi.mockResolvedValue({
      ...sentDetail,
      status: "PARTIALLY_RECEIVED",
    });
    const input = {
      items: [
        { dispatch_item_id: id, quantity_received: "2.5000" },
        {
          dispatch_item_id: "4fa85f64-5717-4562-b3fc-2c963f66afa6",
          quantity_received: "0",
        },
      ],
      note: "One box was crushed.",
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

  it("sends the resolution outcome with a trimmed reason", async () => {
    requestComsApi.mockResolvedValue({
      ...sentDetail,
      status: "CLOSED_WITH_SHORTAGE",
    });
    await expect(
      closeDispatchShortageAction(
        id,
        {
          outcome: "NOT_LOADED",
          reason: "  Left on the loading bay  ",
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
          outcome: "NOT_LOADED",
          reason: "Left on the loading bay",
          items: [{ dispatch_item_id: id, quantity_closed: "2" }],
        },
        headers: { "Idempotency-Key": idempotencyKey },
      },
    );
  });

  it("rejects invalid IDs, retry keys, names, counts, and outcomes without calling the API", async () => {
    await expect(
      createDispatchAction({ branch_id: "bad-id", items: [] }, idempotencyKey),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      postDispatchAction(id, { delivered_by_name: "Juan" }, "bad-key"),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      postDispatchAction(id, { delivered_by_name: "" }, idempotencyKey),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      receiveDispatchAction(
        id,
        { items: [{ dispatch_item_id: id, quantity_received: "-1" }] },
        idempotencyKey,
      ),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      closeDispatchShortageAction(
        id,
        {
          reason: "Missing outcome",
          items: [{ dispatch_item_id: id, quantity_closed: "1" }],
        },
        idempotencyKey,
      ),
    ).resolves.toMatchObject({ ok: false });
    expect(requestComsApi).not.toHaveBeenCalled();
  });

  it("shows the server's workflow rule and hides retry-key details", async () => {
    requestComsApi.mockRejectedValueOnce(
      new ApiRequestError("This delivery has already been counted", 409),
    );
    await expect(
      receiveDispatchAction(
        id,
        { items: [{ dispatch_item_id: id, quantity_received: "1" }] },
        idempotencyKey,
      ),
    ).resolves.toEqual({
      ok: false,
      error: "This delivery has already been counted",
    });
    requestComsApi.mockRejectedValueOnce(
      new ApiRequestError("Idempotency key was already used", 409),
    );
    await expect(
      postDispatchAction(id, { delivered_by_name: "Juan" }, idempotencyKey),
    ).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining("workflow changed"),
    });
    requestComsApi.mockRejectedValueOnce(
      new ApiRequestError("The person who sent this dispatch cannot count it", 403),
    );
    await expect(
      receiveDispatchAction(
        id,
        { items: [{ dispatch_item_id: id, quantity_received: "1" }] },
        idempotencyKey,
      ),
    ).resolves.toEqual({
      ok: false,
      error: "The person who sent this dispatch cannot count it",
    });
  });
});
