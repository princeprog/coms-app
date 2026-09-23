import { describe, expect, it } from "vitest";
import { authTestSessionUser, authTestUser } from "@/test/auth-fixtures";
import {
  filterNavigationForUser,
  hasBranchScope,
  hasPermission,
} from "./permissions";

const items = [
  { title: "Dashboard", url: "/dashboard" },
  { title: "Inventory", url: "/inventory", permission: "inventory.read" },
  { title: "Staff", url: "/staff", permission: "staff.read" },
];

describe("permission aware navigation", () => {
  it("keeps public-in-context links and only granted features", () => {
    expect(filterNavigationForUser(authTestSessionUser, items)).toEqual([
      items[0],
      items[1],
    ]);
  });

  it("does not reveal feature links for grant-free accounts", () => {
    expect(filterNavigationForUser(authTestUser, items)).toEqual([items[0]]);
    expect(hasPermission(authTestUser, "inventory.read")).toBe(false);
  });

  it("reveals recipe management only when recipes.read is granted", () => {
    const recipes = [
      { title: "Recipes", url: "/recipes", permission: "recipes.read" },
    ];
    expect(
      filterNavigationForUser(
        { ...authTestSessionUser, permissions: ["recipes.read"] },
        recipes,
      ),
    ).toEqual(recipes);
    expect(filterNavigationForUser(authTestUser, recipes)).toEqual([]);
  });

  it("recognizes only an active protected Super Admin bypass", () => {
    const superAdmin = {
      ...authTestUser,
      role: {
        id: "2",
        code: "SUPER_ADMIN",
        name: "Super Admin",
        isSystem: true,
        isActive: true,
      },
    };
    expect(hasPermission(superAdmin, "staff.deactivate")).toBe(true);
    expect(
      hasPermission(
        { ...superAdmin, role: { ...superAdmin.role, isActive: false } },
        "staff.deactivate",
      ),
    ).toBe(false);
    expect(
      hasPermission(
        {
          ...superAdmin,
          role: { ...superAdmin.role, isSystem: false },
        },
        "staff.deactivate",
      ),
    ).toBe(false);
  });

  it("limits branch actions to assigned branches except for active Super Admin", () => {
    const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
    const assignedUser = {
      ...authTestSessionUser,
      branch_ids: [branchId],
    };
    expect(hasBranchScope(assignedUser, branchId)).toBe(true);
    expect(
      hasBranchScope(assignedUser, "550e8400-e29b-41d4-a716-446655440000"),
    ).toBe(false);
    expect(hasBranchScope(authTestUser, branchId)).toBe(false);

    const superAdmin = {
      ...authTestUser,
      role: {
        id: "2",
        code: "SUPER_ADMIN",
        name: "Super Admin",
        isSystem: true,
        isActive: true,
      },
    };
    expect(hasBranchScope(superAdmin, branchId)).toBe(true);
    expect(
      hasBranchScope(
        { ...superAdmin, role: { ...superAdmin.role, isActive: false } },
        branchId,
      ),
    ).toBe(false);
    expect(
      hasBranchScope(
        { ...superAdmin, role: { ...superAdmin.role, isSystem: false } },
        branchId,
      ),
    ).toBe(false);
  });
});
