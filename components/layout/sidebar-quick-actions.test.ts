import { describe, expect, it } from "vitest";
import { authTestSessionUser, authTestUser } from "@/test/auth-fixtures";
import { getSidebarQuickActions } from "./sidebar-quick-actions";

describe("sidebar quick actions", () => {
  it("links authorized users directly to the four creation flows", () => {
    const user = {
      ...authTestSessionUser,
      permissions: [
        "supplier_receipts.read",
        "supplier_receipts.create",
        "suppliers.read",
        "stock_items.read",
        "stock_requests.read",
        "stock_requests.create",
        "branches.read",
        "sales.create",
        "branch_products.read",
        "daily_reports.read",
        "daily_reports.create",
      ],
    };

    expect(
      getSidebarQuickActions(user).map(({ title, href }) => [title, href]),
    ).toEqual([
      ["New receipt", "/receipts?create=1"],
      ["New stock request", "/replenishment?create=1"],
      ["New sale", "/pos"],
      ["New daily report", "/reports?create=1"],
    ]);
  });

  it("hides creation links when the role is missing or required grants are missing", () => {
    expect(getSidebarQuickActions(authTestUser)).toEqual([]);
    expect(
      getSidebarQuickActions({
        ...authTestSessionUser,
        permissions: ["supplier_receipts.create", "stock_requests.create"],
      }),
    ).toEqual([]);
  });

  it("keeps only supplier receiving in the Super Admin quick actions", () => {
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

    expect(getSidebarQuickActions(superAdmin).map(({ title }) => title)).toEqual([
      "New receipt",
    ]);
  });
});
