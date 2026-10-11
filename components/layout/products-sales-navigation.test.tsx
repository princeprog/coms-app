import { describe, expect, it } from "vitest";
import { authTestSessionUser } from "@/test/auth-fixtures";
import { getAppSidebarNavigationGroups } from "./sidebar-navigation";

function group(permissions: string[]) {
  return (
    getAppSidebarNavigationGroups({ ...authTestSessionUser, permissions }).find(
      (item) => item.title === "Products & Sales",
    )?.items ?? []
  );
}

describe("consolidated Products & Sales navigation", () => {
  it("offers four workspaces instead of duplicate directories", () => {
    expect(
      group([
        "products.read",
        "recipes.read",
        "branch_products.read",
        "branch_products.update",
        "menu_requests.read",
        "menu_templates.read",
        "sales.create",
        "sales.read",
        "daily_reports.read",
      ]).map((item) => item.title),
    ).toEqual(["Products", "Branch Menu", "Point of Sale", "Daily Reports"]);
  });
  it.each([
    ["branch_products.update", "/branch-products"],
    ["menu_requests.read", "/branch-products"],
    ["menu_templates.read", "/branch-products"],
  ])("keeps the menu workspace reachable with only %s", (permission) => {
    expect(group([permission])).toEqual([]);
  });
  it("keeps read-only sales users connected to sales history", () => {
    expect(group(["sales.read"])).toMatchObject([
      { title: "Point of Sale", url: "/pos" },
    ]);
  });
});
