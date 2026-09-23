import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/features/auth/types/auth.types";
import { ApiRequestError } from "@/services/api-services";
import {
  loadStockRequestDetailView,
  loadStockRequestIndexView,
} from "./stock-request-page-loader";

const {
  getStockRequestDetail,
  getStockRequestBranches,
  getStockRequestFormOptions,
  getStockRequestPageData,
} = vi.hoisted(() => ({
  getStockRequestDetail: vi.fn(),
  getStockRequestBranches: vi.fn(),
  getStockRequestFormOptions: vi.fn(),
  getStockRequestPageData: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./stock-request-queries", () => ({
  getStockRequestDetail,
  getStockRequestBranches,
  getStockRequestFormOptions,
  getStockRequestPageData,
}));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const timestamp = "2026-09-24T01:30:00.000Z";
const page = { items: [], total: 0, page: 1, page_size: 25 };
const detail = {
  id,
  branch_id: id,
  branch_name: "Downtown",
  requested_by_user_id: id,
  requester_name: "Branch Manager",
  status: "PENDING" as const,
  created_at: timestamp,
  updated_at: timestamp,
  items: [],
  events: [],
};
const options = {
  branches: [
    {
      id,
      code: "DT",
      branch_name: "Downtown",
      address: null,
      date_opened: null,
      has_dine_in: false,
      status: "active" as const,
    },
  ],
  stockItems: [
    {
      id,
      stock_item_name: "Flour",
      category: "Dry goods",
      unit: "kg",
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
  ],
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

describe("stock request page loader", () => {
  beforeEach(() => {
    getStockRequestDetail.mockReset().mockResolvedValue(detail);
    getStockRequestBranches.mockReset().mockResolvedValue(options.branches);
    getStockRequestFormOptions.mockReset().mockResolvedValue(options);
    getStockRequestPageData.mockReset().mockResolvedValue(page);
  });

  it("denies the list without stock_requests.read", async () => {
    await expect(loadStockRequestIndexView(user([], []), {})).resolves.toEqual({
      status: "forbidden",
    });
    expect(getStockRequestPageData).not.toHaveBeenCalled();
  });

  it("loads creation options only when branch and stock-item reads are granted", async () => {
    await expect(
      loadStockRequestIndexView(
        user([
          "stock_requests.read",
          "stock_requests.create",
          "branches.read",
          "stock_items.read",
          "stock_requests.approve",
          "stock_requests.reject",
          "stock_requests.cancel",
        ]),
        { branch_id: id, status: "PENDING" },
      ),
    ).resolves.toMatchObject({
      status: "ready",
      page,
      filters: { branch_id: id, status: "PENDING" },
      canCreate: true,
      canApprove: true,
      canReject: true,
      canCancel: true,
      formOptions: options,
    });
    expect(getStockRequestPageData).toHaveBeenCalledWith({
      page: 1,
      branch_id: id,
      status: "PENDING",
    });
    expect(getStockRequestFormOptions).toHaveBeenCalledTimes(1);
  });

  it("loads assigned branches for filters without requiring create access", async () => {
    await expect(
      loadStockRequestIndexView(
        user(["stock_requests.read", "branches.read"]),
        {},
      ),
    ).resolves.toMatchObject({
      status: "ready",
      canCreate: false,
      branchOptions: options.branches,
    });
    expect(getStockRequestBranches).toHaveBeenCalledWith([id]);
    expect(getStockRequestFormOptions).not.toHaveBeenCalled();
  });

  it("rejects a selected branch outside the signed-in user's assignments", async () => {
    await expect(
      loadStockRequestIndexView(user(["stock_requests.read"], []), {
        branch_id: id,
      }),
    ).resolves.toEqual({ status: "forbidden" });
    expect(getStockRequestPageData).not.toHaveBeenCalled();
  });

  it("keeps listing available when create permissions or option loading is unavailable", async () => {
    await expect(
      loadStockRequestIndexView(
        user(["stock_requests.read", "stock_requests.create"]),
        {},
      ),
    ).resolves.toMatchObject({
      status: "ready",
      canCreate: true,
      formOptions: null,
      formOptionsIssue: "permissions",
    });
    expect(getStockRequestFormOptions).not.toHaveBeenCalled();

    getStockRequestFormOptions.mockRejectedValue(
      new ApiRequestError("Catalog access denied.", 403),
    );
    await expect(
      loadStockRequestIndexView(
        user([
          "stock_requests.read",
          "stock_requests.create",
          "branches.read",
          "stock_items.read",
        ]),
        {},
      ),
    ).resolves.toMatchObject({
      status: "ready",
      formOptions: null,
      formOptionsIssue: "forbidden",
    });
  });

  it("exposes only granted transition actions for an assigned pending request", async () => {
    await expect(
      loadStockRequestDetailView(
        user(["stock_requests.read", "stock_requests.cancel"]),
        id,
      ),
    ).resolves.toMatchObject({
      status: "ready",
      request: detail,
      canApprove: false,
      canReject: false,
      canCancel: true,
    });
    expect(getStockRequestDetail).toHaveBeenCalledWith(id);
  });

  it("allows dispatch preparation only for an approved request and grant", async () => {
    getStockRequestDetail.mockResolvedValue({ ...detail, status: "APPROVED" });
    await expect(
      loadStockRequestDetailView(
        user(["stock_requests.read", "dispatches.create"]),
        id,
      ),
    ).resolves.toMatchObject({ status: "ready", canCreateDispatch: true });
    await expect(
      loadStockRequestDetailView(user(["stock_requests.read"]), id),
    ).resolves.toMatchObject({ status: "ready", canCreateDispatch: false });
  });

  it("hides details outside branch scope and classifies missing requests", async () => {
    await expect(
      loadStockRequestDetailView(
        user(["stock_requests.read"], ["d34b9dc6-135f-4bd0-9f25-43a9617c9e0a"]),
        id,
      ),
    ).resolves.toEqual({ status: "forbidden" });

    getStockRequestDetail.mockRejectedValue(
      new ApiRequestError("Stock request not found.", 404),
    );
    await expect(
      loadStockRequestDetailView(user(["stock_requests.read"]), id),
    ).resolves.toEqual({ status: "not-found" });
  });
});
