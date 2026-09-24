// @vitest-environment jsdom
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authTestSessionUser } from "@/test/auth-fixtures";

const { route, sidebarRenders } = vi.hoisted(() => ({
  route: { pathname: "/dashboard" },
  sidebarRenders: { count: 0 },
}));

vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

vi.mock("@/components/app-sidebar", async () => {
  const React = await import("react");
  return {
    AppSidebar: React.memo(function AppSidebar() {
      sidebarRenders.count += 1;
      return React.createElement("aside", { "data-testid": "sidebar" });
    }),
  };
});

vi.mock("@/components/site-header", async () => {
  const React = await import("react");
  return {
    SiteHeader: () =>
      React.createElement(
        "h1",
        null,
        route.pathname.startsWith("/receipts/") ? "Receiving" : "Documents",
      ),
  };
});

vi.mock("@/components/ui/sidebar", async () => {
  const React = await import("react");
  return {
    SidebarProvider: ({ children }: { children: ReactNode }) =>
      React.createElement("div", null, children),
    SidebarInset: ({ children }: { children: ReactNode }) =>
      React.createElement("main", null, children),
  };
});

vi.mock("@/features/auth/components/auth-query-seed", () => ({
  AuthQuerySeed: () => null,
}));

import { AuthenticatedAppShell } from "./authenticated-app-shell";

describe("AuthenticatedAppShell", () => {
  beforeEach(() => {
    route.pathname = "/dashboard";
    sidebarRenders.count = 0;
  });

  it("keeps the sidebar mounted and updates the header and page on navigation", () => {
    const view = render(
      <AuthenticatedAppShell user={authTestSessionUser}>
        <p>Dashboard content</p>
      </AuthenticatedAppShell>,
    );
    const sidebarBeforeNavigation = screen.getByTestId("sidebar");
    const rendersBeforeNavigation = sidebarRenders.count;

    route.pathname = "/receipts/receipt-1";
    view.rerender(
      <AuthenticatedAppShell user={authTestSessionUser}>
        <p>Receipt content</p>
      </AuthenticatedAppShell>,
    );

    expect(screen.getByTestId("sidebar")).toBe(sidebarBeforeNavigation);
    expect(sidebarRenders.count).toBe(rendersBeforeNavigation);
    expect(screen.getByRole("heading", { name: "Receiving" })).toBeTruthy();
    expect(screen.getByText("Receipt content")).toBeTruthy();
    expect(screen.queryByText("Dashboard content")).toBeNull();
  });
});
