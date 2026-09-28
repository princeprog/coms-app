import { describe, expect, it } from "vitest";
import { getAppSidebarNavigation, navItems } from "@/components/app-sidebar";
import { authTestUser } from "@/test/auth-fixtures";

describe("app sidebar role context", () => {
  it("does not show POS to protected Super Admin while keeping review navigation", () => {
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

    const items = getAppSidebarNavigation(superAdmin);
    expect(items.some((item) => item.url === "/pos")).toBe(false);
    expect(items).toEqual(
      expect.arrayContaining(
        navItems.filter((item) =>
          ["/dashboard", "/dispatches", "/reports", "/roles"].includes(
            item.url,
          ),
        ),
      ),
    );
  });
});
