import { beforeEach, expect, it, vi } from "vitest";
import { searchProductBranchesAction } from "./product-branch-actions";

const { access, getPage } = vi.hoisted(() => ({
  access: vi.fn(),
  getPage: vi.fn(),
}));
vi.mock("@/features/menus/services/menu-server", () => ({
  menuAccess: access,
}));
vi.mock("./product-setup-queries", () => ({ getProductBranchPage: getPage }));
beforeEach(() => {
  access.mockReset();
  getPage.mockReset();
});

it("rejects a branch user before requesting menu-assignment choices", async () => {
  access.mockResolvedValue({
    role: { code: "BRANCH_MANAGER", isSystem: false, isActive: true },
  });
  const result = await searchProductBranchesAction({ page: 1, search: "Main" });
  expect(result.ok).toBe(false);
  expect(getPage).not.toHaveBeenCalled();
});
it("validates bounded branch search before calling the API", async () => {
  expect(
    (await searchProductBranchesAction({ page: 0, search: "Main" })).ok,
  ).toBe(false);
  expect(
    (await searchProductBranchesAction({ page: 1, search: "x".repeat(101) }))
      .ok,
  ).toBe(false);
  expect(access).not.toHaveBeenCalled();
});
it("uses the authorized paginated server query with trimmed search", async () => {
  access.mockResolvedValue({
    role: { code: "SUPER_ADMIN", isSystem: true, isActive: true },
  });
  const data = { items: [], total: 0, page: 2, page_size: 25 };
  getPage.mockResolvedValue(data);
  expect(
    await searchProductBranchesAction({ page: 2, search: " Main " }),
  ).toEqual({ ok: true, data });
  expect(access).toHaveBeenCalledWith("branches.read");
  expect(getPage).toHaveBeenCalledWith(2, "Main");
});
