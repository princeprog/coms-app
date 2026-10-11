import { expect, it } from "vitest";
import { authTestSessionUser } from "@/test/auth-fixtures";
import { getAppSidebarNavigation } from "@/components/layout/sidebar-navigation";
it("exposes payment administration only to protected active Super Admin", () => {
  const user = {
    ...authTestSessionUser,
    role: { ...authTestSessionUser.role, code: "SUPER_ADMIN", isSystem: true },
  };
  expect(
    getAppSidebarNavigation(user).some(
      (item) => item.url === "/payment-methods",
    ),
  ).toBe(true);
  for (const role of [
    { ...user.role, isSystem: false },
    { ...user.role, isActive: false },
    authTestSessionUser.role,
  ])
    expect(
      getAppSidebarNavigation({ ...user, role }).some(
        (item) => item.url === "/payment-methods",
      ),
    ).toBe(false);
});
