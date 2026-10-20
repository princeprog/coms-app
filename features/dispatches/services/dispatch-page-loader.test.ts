import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/features/auth/types/auth.types";
import { ApiRequestError } from "@/services/api-services";
import {
  loadDispatchDetailView,
  loadDispatchIndexView,
} from "./dispatch-page-loader";

const { getDispatchCreateOptions, getDispatchDetail, getDispatchPageData } =
  vi.hoisted(() => ({
    getDispatchCreateOptions: vi.fn(),
    getDispatchDetail: vi.fn(),
    getDispatchPageData: vi.fn(),
  }));

vi.mock("server-only", () => ({}));
vi.mock("./dispatch-queries", () => ({
  getDispatchCreateOptions,
  getDispatchDetail,
  getDispatchPageData,
}));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const senderId = "5fa85f64-5717-4562-b3fc-2c963f66afa6";
const timestamp = "2026-09-24T01:30:00.000Z";
const page = { items: [], total: 0, page: 1, page_size: 10 };
const detail = {
  id,
  branch_id: id,
  branch_name: "Downtown",
  status: "IN_TRANSIT" as const,
  created_by_user_id: id,
  created_by_name: "Commissary Staff",
  dispatched_by_user_id: senderId,
  dispatched_by_name: "Commissary Staff",
  dispatched_at: timestamp,
  counted_at: null,
  counted_by_user_id: null,
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
    getDispatchCreateOptions.mockReset().mockResolvedValue({
      branches: [],
      stockItems: [],
    });
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
      pageSize: 10,
      status: "IN_TRANSIT",
      discrepancyStatus: "all",
    });
  });

  it("enables direct creation only when the user can read both catalogs", async () => {
    await expect(
      loadDispatchIndexView(
        user([
          "dispatches.read",
          "dispatches.create",
          "dispatches.dispatch",
          "branches.read",
          "stock_items.read",
        ]),
        {},
      ),
    ).resolves.toMatchObject({
      status: "ready",
      canCreate: true,
      createOptions: { branches: [], stockItems: [] },
      createOptionsIssue: null,
    });
    await expect(
      loadDispatchIndexView(
        user(["dispatches.read", "dispatches.create", "dispatches.dispatch"]),
        {},
      ),
    ).resolves.toMatchObject({
      status: "ready",
      canCreate: true,
      createOptions: null,
      createOptionsIssue: "permissions",
    });
    expect(getDispatchCreateOptions).toHaveBeenCalledTimes(1);
    await expect(
      loadDispatchIndexView(user(["dispatches.read"]), {}),
    ).resolves.toMatchObject({ status: "ready", canCreate: false });
  });

  it("lets the assigned branch user count an uncounted delivery once", async () => {
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
      canResolve: false,
    });
    getDispatchDetail.mockResolvedValue({
      ...detail,
      status: "PARTIALLY_RECEIVED",
      counted_at: timestamp,
      counted_by_user_id: id,
    });
    await expect(
      loadDispatchDetailView(
        user(["dispatches.read", "dispatches.receive"]),
        id,
      ),
    ).resolves.toMatchObject({ canReceive: false, canResolve: false });
  });

  it("never lets the sender count or the counter resolve", async () => {
    getDispatchDetail.mockResolvedValue({
      ...detail,
      dispatched_by_user_id: id,
    });
    await expect(
      loadDispatchDetailView(
        user(["dispatches.read", "dispatches.receive"]),
        id,
      ),
    ).resolves.toMatchObject({ canReceive: false });
    getDispatchDetail.mockResolvedValue({
      ...detail,
      status: "PARTIALLY_RECEIVED",
      counted_at: timestamp,
      counted_by_user_id: id,
    });
    await expect(
      loadDispatchDetailView(
        user(["dispatches.read", "dispatches.shortage_close"]),
        id,
      ),
    ).resolves.toMatchObject({ canResolve: false });
  });

  it("lets Super Admin resolve a counted variance but never count a delivery", async () => {
    getDispatchDetail.mockResolvedValue({
      ...detail,
      status: "PARTIALLY_RECEIVED",
      counted_at: timestamp,
      counted_by_user_id: senderId,
      discrepancy: { status: "OPEN" },
    });
    const admin = {
      ...user([]),
      role: {
        id,
        code: "SUPER_ADMIN",
        name: "Super Admin",
        isSystem: true,
        isActive: true,
      },
    };
    await expect(loadDispatchDetailView(admin, id)).resolves.toMatchObject({
      status: "ready",
      canReceive: false,
      canResolve: true,
    });
  });

  it("allows independent review of a held count before stock is posted", async () => {
    const held = {
      ...detail,
      receiving_status: "REVIEW",
      late_counts: [
        { id: senderId, status: "PENDING", counted_by_user_id: senderId },
      ],
    };
    getDispatchDetail.mockResolvedValue(held);
    await expect(
      loadDispatchDetailView(
        user(["dispatches.read", "dispatches.shortage_close"]),
        id,
      ),
    ).resolves.toMatchObject({ canResolve: true });
    getDispatchDetail.mockResolvedValue({
      ...held,
      late_counts: [{ ...held.late_counts[0], counted_by_user_id: id }],
    });
    await expect(
      loadDispatchDetailView(
        user(["dispatches.read", "dispatches.shortage_close"]),
        id,
      ),
    ).resolves.toMatchObject({ canResolve: false });
    getDispatchDetail.mockResolvedValue(held);
    await expect(
      loadDispatchDetailView(user(["dispatches.read"]), id),
    ).resolves.toMatchObject({ canResolve: false });
  });

  it("hides counting and resolution actions for a draft", async () => {
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
      canResolve: false,
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
