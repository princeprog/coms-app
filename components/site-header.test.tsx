// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { toast } from "@/components/ui/toast";

vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));
afterEach(() => vi.unstubAllEnvs());

const navigationState = vi.hoisted(() => ({ pathname: "/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

vi.mock("@/features/shifts/components/shift-header-control", () => ({
  ShiftHeaderControl: () => null,
}));

vi.mock("@/components/ui/sidebar", async () => {
  const React = await import("react");
  return {
    SidebarTrigger: () => React.createElement("button", { type: "button" }),
  };
});

vi.mock("@/components/ui/separator", async () => {
  const React = await import("react");
  return {
    Separator: () => React.createElement("span"),
  };
});

import { SiteHeader } from "./site-header";

describe("SiteHeader route titles", () => {
  beforeEach(() => {
    navigationState.pathname = "/dashboard";
    vi.mocked(toast.add).mockClear();
  });

  it("shows a working toast preview only in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Test toast" }));
    expect(toast.add).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: "Test notification",
      description: "This is how notifications appear in COMS.",
    });
  });

  it.each(["production", "test"])(
    "hides toast testing in %s",
    (environment) => {
      vi.stubEnv("NODE_ENV", environment);
      render(<SiteHeader />);
      expect(screen.queryByRole("button", { name: "Test toast" })).toBeNull();
      expect(toast.add).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["/dashboard", "Dashboard"],
    ["/receipts", "Supplier Receiving"],
    ["/receipts/receipt-1", "Supplier Receiving"],
    ["/recipes/product-1", "Products"],
    ["/menu-requests/request-1", "Branch Menu"],
  ])("shows the title for %s", (pathname, title) => {
    navigationState.pathname = pathname;
    render(<SiteHeader />);

    expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Change theme" })).toBeTruthy();
  });
});

vi.mock("@/features/notifications/services/notification-actions", () => ({
  getNotificationCountAction: vi.fn(),
  getNotificationsAction: vi.fn(),
  markNotificationReadAction: vi.fn(),
}));
