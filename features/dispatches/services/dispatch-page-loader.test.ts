import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/features/auth/types/auth.types";
import { ApiRequestError } from "@/services/api-services";
import {
  loadDispatchDetailView,
  loadDispatchIndexView,
} from "./dispatch-page-loader";

const { getDispatchDetail, getDispatchPageData } = vi.hoisted(() => ({
  getDispatchDetail: vi.fn(),
  getDispatchPageData: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./dispatch-queries", () => ({
  getDispatchDetail,
  getDispatchPageData,
}));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const timestamp = "2026-09-24T01:30:00.000Z";
const page = { items: [], total: 0, page: 1, page_size: 25 };
const detail = {
  id,
  stock_request_id: id,
  branch_id: id,
  branch_name: "Downtown",
  stock_request_status: "APPROVED" as const,
  status: "IN_TRANSIT" as const,
  created_by_user_id: id,
  created_by_name: "Commissary Staff",
  dispatched_by_user_id: id,
  dispatched_by_name: "Commissary Staff",
  dispatched_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp,
  items: [],
  receipts: [],
  shortage_closures: [],
  events: [],
};

function user(permissions: string[], branchIds: string[] = [id]): User {
  return {
    id,
    email: "manager@example.com",
    full_name: "Branch Manager",
    contact_number: "",
    role: {
      id,
      code: "BRANCH_MANAGER",
      name: "Branch Manager",
      isSystem: false,
      isActive: true,
    },
    permissions,
    branch_ids: branchIds,
  };
}

describe("dispatch page loader", () => {
  beforeEach(() => {
    getDispatchDetail.mockReset().mockResolvedValue(detail);
    getDispatchPageData.mockReset().mockResolvedValue(page);
  });

  it("denies the index without dispatches.read", async () => {
    await expect(loadDispatchIndexView(user([], []), {})).resolves.toEqual({
      status: "forbidden",
    });
    expect(getDispatchPageData).not.toHaveBeenCalled();
  });

  it("loads a status-filtered page and redirects pages past the result", async () => {
    getDispatchPageData.mockResolvedValue({
      ...page,
      items: [{ id }],
      total: 1,
      page: 4,
    });
    await expect(
      loadDispatchIndexView(user(["dispatches.read"]), {
        page: "4",
        status: "IN_TRANSIT",
      }),
    ).resolves.toEqual({
      status: "redirect",
      href: "/dispatches?status=IN_TRANSIT",
    });
    expect(getDispatchPageData).toHaveBeenCalledWith({
      page: 4,
      status: "IN_TRANSIT",
    });
  });

  it("enables the approved-request link only for users who can create dispatches", async () => {
    await expect(
      loadDispatchIndexView(user(["dispatches.read", "dispatches.create"]), {}),
    ).resolves.toMatchObject({ status: "ready", canCreate: true });
    await expect(
      loadDispatchIndexView(user(["dispatches.read"]), {}),
    ).resolves.toMatchObject({ status: "ready", canCreate: false });
  });

  it("shows only workflow actions granted to the assigned branch user", async () => {
    await expect(
      loadDispatchDetailView(
        user(["dispatches.read", "dispatches.receive"]),
        id,
      ),
    ).resolves.toMatchObject({
      status: "ready",
      dispatch: detail,
      canDispatch: false,
      canReceive: true,
      canCloseShortage: false,
    });
  });

  it("hides receiving and shortage actions for a draft", async () => {
    getDispatchDetail.mockResolvedValue({ ...detail, status: "DRAFT" });
    await expect(
      loadDispatchDetailView(
        user([
          "dispatches.read",
          "dispatches.dispatch",
          "dispatches.receive",
          "dispatches.shortage_close",
        ]),
        id,
      ),
    ).resolves.toMatchObject({
      status: "ready",
      canDispatch: true,
      canReceive: false,
      canCloseShortage: false,
    });
  });

  it("hides dispatches outside the user branch assignments", async () => {
    await expect(
      loadDispatchDetailView(user(["dispatches.read"], []), id),
    ).resolves.toEqual({ status: "forbidden" });
  });

  it("maps expired sessions and missing dispatches to route states", async () => {
    getDispatchDetail.mockRejectedValueOnce(
      new ApiRequestError("expired", 401),
    );
    await expect(
      loadDispatchDetailView(user(["dispatches.read"]), id),
    ).resolves.toEqual({ status: "session-expired" });
    getDispatchDetail.mockRejectedValueOnce(
      new ApiRequestError("missing", 404),
    );
    await expect(
      loadDispatchDetailView(user(["dispatches.read"]), id),
    ).resolves.toEqual({ status: "not-found" });
  });
});
