import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";
import { sendCountReminderAction } from "./count-reminder-action";
const { requestComsApi, revalidatePath } = vi.hoisted(() => ({
  requestComsApi: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "coms_access=fixture" }),
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

describe("count reminder action", () => {
  beforeEach(() => vi.clearAllMocks());
  it("forwards the cookie and retry key and returns confirmed metadata", async () => {
    const metadata = {
      last_sent_at: timestamp,
      next_allowed_at: "2026-09-24T02:00:00.000Z",
    };
    requestComsApi.mockResolvedValue({
      ...sentDetail,
      count_reminder: metadata,
    });
    expect(await sendCountReminderAction(id, idempotencyKey)).toEqual({
      ok: true,
      data: metadata,
    });
    expect(requestComsApi).toHaveBeenCalledWith(
      `/dispatches/${id}/count-reminders`,
      {
        method: "POST",
        cookieHeader: "coms_access=fixture",
        headers: { "Idempotency-Key": idempotencyKey },
      },
    );
    expect(revalidatePath).toHaveBeenCalledWith(`/dispatches/${id}`);
  });
  it("keeps server cooldown timing available to the control", async () => {
    const next_allowed_at = "2026-09-24T02:00:00.000Z";
    requestComsApi.mockRejectedValue(
      new ApiRequestError("Please wait", 429, { next_allowed_at }),
    );
    expect(await sendCountReminderAction(id, idempotencyKey)).toEqual({
      ok: false,
      status: 429,
      error: "Please wait",
      next_allowed_at,
    });
  });
  it("does not claim success for an unconfirmed response", async () => {
    requestComsApi.mockResolvedValue(sentDetail);
    expect(await sendCountReminderAction(id, idempotencyKey)).toMatchObject({
      ok: false,
      status: 502,
    });
  });
  it("rejects invalid identifiers before making a request", async () => {
    expect(await sendCountReminderAction("bad", idempotencyKey)).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(requestComsApi).not.toHaveBeenCalled();
  });
});
