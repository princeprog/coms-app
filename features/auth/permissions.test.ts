import { describe, expect, it } from "vitest";
import { authTestSessionUser, authTestUser } from "@/test/auth-fixtures";
import { filterNavigationForUser, hasPermission } from "./permissions";

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
});
