import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";
import { getDispatchDetail, getDispatchPageData } from "./dispatch-queries";

const { requestComsApi } = vi.hoisted(() => ({ requestComsApi: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "coms_access=access-token" }),
}));
vi.mock("@/services/server-api-services", () => ({ requestComsApi }));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const timestamp = "2026-09-24T01:30:00.000Z";
const dispatch = {
  id,
  stock_request_id: id,
  branch_id: id,
  branch_name: "Downtown",
  stock_request_status: "APPROVED",
  status: "DRAFT",
  created_by_user_id: id,
  created_by_name: "Commissary Staff",
  dispatched_by_user_id: null,
  dispatched_by_name: null,
  dispatched_at: null,
  created_at: timestamp,
  updated_at: timestamp,
  item_count: 1,
};

describe("dispatch queries", () => {
  beforeEach(() => requestComsApi.mockReset());

  it("loads and validates a paginated dispatch response", async () => {
    const page = { items: [dispatch], total: 1, page: 2, page_size: 25 };
    requestComsApi.mockResolvedValue(page);

    await expect(
      getDispatchPageData({ page: 2, status: "IN_TRANSIT" }),
    ).resolves.toEqual(page);
    expect(requestComsApi).toHaveBeenCalledWith(
      "/dispatches?page=2&page_size=25&status=IN_TRANSIT",
      { cookieHeader: "coms_access=access-token" },
    );
  });

  it("rejects malformed page data and invalid dispatch IDs", async () => {
    requestComsApi.mockResolvedValue({ ...dispatch, total: "one" });
    await expect(
      getDispatchPageData({ page: 1, status: "all" }),
    ).rejects.toMatchObject({ status: 502 });
    await expect(getDispatchDetail("bad-id")).rejects.toMatchObject({
      status: 404,
    });
    expect(requestComsApi).toHaveBeenCalledTimes(1);
  });

  it("loads a detail response and rejects an invalid payload", async () => {
    const detail = {
      id,
      stock_request_id: id,
      branch_id: id,
      branch_name: "Downtown",
      stock_request_status: "APPROVED",
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
    requestComsApi.mockResolvedValueOnce(detail).mockResolvedValueOnce({ id });

    await expect(getDispatchDetail(id)).resolves.toEqual(detail);
    expect(requestComsApi).toHaveBeenNthCalledWith(1, `/dispatches/${id}`, {
      cookieHeader: "coms_access=access-token",
    });
    await expect(getDispatchDetail(id)).rejects.toBeInstanceOf(ApiRequestError);
  });
});
