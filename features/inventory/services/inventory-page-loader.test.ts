import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/features/auth/types/auth.types";
import { ApiRequestError } from "@/services/api-services";
import { loadInventoryView } from "./inventory-page-loader";

const { getInventoryBranchOptions, getInventoryPageData } = vi.hoisted(() => ({
  getInventoryBranchOptions: vi.fn(),
  getInventoryPageData: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./inventory-queries", () => ({
  getInventoryBranchOptions,
  getInventoryPageData,
}));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const otherBranchId = "540a8340-3556-47a3-9858-10a4f29d2611";
const pageData = {
  inventory: { items: [], total: 0, page: 1, page_size: 25 },
  movements: { items: [], total: 0, page: 1, page_size: 25 },
};

function user(overrides: Partial<User> = {}): User {
  return {
    id: "9b445ee0-532f-4a31-93db-25d01c5f527f",
    email: "manager@example.com",
    full_name: "Branch Manager",
    contact_number: "",
    role: {
      id: "7d4a0c4d-8276-4d1d-9e3c-d40b41a92a11",
      code: "BRANCH_MANAGER",
      name: "Branch Manager",
      isSystem: false,
      isActive: true,
    },
    permissions: ["inventory.read"],
    branch_ids: [branchId],
    ...overrides,
  };
}

describe("loadInventoryView", () => {
  beforeEach(() => {
    getInventoryBranchOptions.mockReset();
    getInventoryPageData.mockReset().mockResolvedValue(pageData);
  });

  it("denies users without either inventory read permission", async () => {
    await expect(
      loadInventoryView(user({ permissions: [] }), {}),
    ).resolves.toEqual({ status: "forbidden" });
    expect(getInventoryPageData).not.toHaveBeenCalled();
  });

  it("rejects an explicitly requested unauthorized scope before loading data", async () => {
    await expect(
      loadInventoryView(user(), { scope: "COMMISSARY" }),
    ).resolves.toEqual({ status: "forbidden" });
    await expect(
      loadInventoryView(user({ permissions: ["inventory.commissary_read"] }), {
        scope: "BRANCH",
      }),
    ).resolves.toEqual({ status: "forbidden" });
    expect(getInventoryBranchOptions).not.toHaveBeenCalled();
    expect(getInventoryPageData).not.toHaveBeenCalled();
  });

  it("denies branch IDs outside the account assignments before loading inventory", async () => {
    await expect(
      loadInventoryView(user(), {
        scope: "BRANCH",
        branch_id: otherBranchId,
      }),
    ).resolves.toEqual({ status: "forbidden" });
    expect(getInventoryPageData).not.toHaveBeenCalled();
  });

  it("loads assigned branch inventory without requiring branch-directory access", async () => {
    await expect(
      loadInventoryView(
        user({ permissions: ["inventory.read", "inventory.adjust"] }),
        {},
      ),
    ).resolves.toMatchObject({
      status: "ready",
      scope: "BRANCH",
      selectedBranchId: branchId,
      branchOptions: [{ id: branchId, name: "Assigned branch" }],
      canAdjust: true,
      canViewBranch: true,
      canViewCommissary: false,
    });
    expect(getInventoryBranchOptions).not.toHaveBeenCalled();
    expect(getInventoryPageData).toHaveBeenCalledWith({
      scope: "BRANCH",
      branchId,
      page: 1,
      search: "",
    });
  });

  it("keeps inactive branch history visible and disables adjustment permission", async () => {
    getInventoryBranchOptions.mockResolvedValue([
      { id: branchId, name: "Manila North", status: "inactive" },
    ]);

    await expect(
      loadInventoryView(
        user({
          permissions: ["inventory.read", "inventory.adjust", "branches.read"],
        }),
        { scope: "BRANCH" },
      ),
    ).resolves.toMatchObject({
      status: "ready",
      branchOptions: [
        { id: branchId, name: "Manila North", status: "inactive" },
      ],
      canAdjust: false,
    });
  });

  it("uses dedicated commissary permissions and defaults users with both scopes to commissary", async () => {
    getInventoryBranchOptions.mockResolvedValue([]);
    await expect(
      loadInventoryView(
        user({
          permissions: [
            "inventory.read",
            "inventory.adjust",
            "inventory.commissary_read",
            "inventory.commissary_adjust",
            "branches.read",
          ],
        }),
        {},
      ),
    ).resolves.toMatchObject({
      status: "ready",
      scope: "COMMISSARY",
      canAdjust: true,
      canViewBranch: true,
      canViewCommissary: true,
    });
    expect(getInventoryBranchOptions).toHaveBeenCalledOnce();
    expect(getInventoryPageData).toHaveBeenCalledWith({
      scope: "COMMISSARY",
      page: 1,
      search: "",
    });
  });

  it("loads authorized branch choices on the commissary default and forwards filters", async () => {
    getInventoryBranchOptions.mockResolvedValue([
      { id: branchId, name: "Manila North", status: "active" },
    ]);

    await expect(
      loadInventoryView(
        user({
          permissions: [
            "inventory.read",
            "inventory.commissary_read",
            "branches.read",
          ],
        }),
        { status: "inactive", category: "Dry goods", search: "Flour" },
      ),
    ).resolves.toMatchObject({
      status: "ready",
      scope: "COMMISSARY",
      branchOptions: [{ id: branchId, name: "Manila North" }],
      statusFilter: "inactive",
      categoryFilter: "Dry goods",
    });

    expect(getInventoryPageData).toHaveBeenCalledWith({
      scope: "COMMISSARY",
      page: 1,
      search: "Flour",
      status: "inactive",
      category: "Dry goods",
    });
  });

  it("does not treat an adjustment grant for one scope as access to the other", async () => {
    await expect(
      loadInventoryView(
        user({
          permissions: ["inventory.commissary_read", "inventory.adjust"],
        }),
        {},
      ),
    ).resolves.toMatchObject({
      status: "ready",
      scope: "COMMISSARY",
      canAdjust: false,
    });

    await expect(
      loadInventoryView(
        user({
          permissions: ["inventory.read", "inventory.commissary_adjust"],
        }),
        {},
      ),
    ).resolves.toMatchObject({
      status: "ready",
      scope: "BRANCH",
      canAdjust: false,
    });
  });

  it("sends out-of-range pages to the final valid page", async () => {
    getInventoryPageData.mockResolvedValue({
      inventory: { items: [], total: 51, page: 10, page_size: 25 },
      movements: pageData.movements,
    });

    await expect(
      loadInventoryView(
        user({
          permissions: ["inventory.commissary_read"],
          branch_ids: [],
        }),
        {
          page: "10",
          search: "Flour",
          status: "active",
          category: "Dry goods",
        },
      ),
    ).resolves.toEqual({
      status: "redirect",
      href: "/inventory?scope=COMMISSARY&page=3&search=Flour&status=active&category=Dry+goods",
    });
  });

  it("keeps the branch assignment empty state for branch-only users", async () => {
    await expect(
      loadInventoryView(user({ branch_ids: [] }), {}),
    ).resolves.toMatchObject({
      status: "branch-unavailable",
      canViewBranch: true,
      canViewCommissary: false,
    });
    expect(getInventoryPageData).not.toHaveBeenCalled();
  });

  it("maps expired and forbidden inventory sessions to route-safe results", async () => {
    getInventoryPageData.mockRejectedValueOnce(
      new ApiRequestError("Session expired.", 401),
    );
    await expect(loadInventoryView(user(), {})).resolves.toEqual({
      status: "session-expired",
    });

    getInventoryPageData.mockRejectedValueOnce(
      new ApiRequestError("Inventory access denied.", 403),
    );
    await expect(loadInventoryView(user(), {})).resolves.toEqual({
      status: "forbidden",
    });
  });

  it("shows a branch load error when branch choices cannot be read", async () => {
    getInventoryBranchOptions.mockRejectedValue(
      new ApiRequestError("Branch service unavailable.", 503),
    );

    await expect(
      loadInventoryView(
        user({ permissions: ["inventory.read", "branches.read"] }),
        { scope: "BRANCH" },
      ),
    ).resolves.toEqual({ status: "branch-options-error" });
    expect(getInventoryPageData).not.toHaveBeenCalled();
  });
});
