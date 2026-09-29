// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationState = vi.hoisted(() => ({ pathname: "/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
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
  });

  it.each([
    ["/dashboard", "Dashboard"],
    ["/receipts", "Supplier Receiving"],
    ["/receipts/receipt-1", "Supplier Receiving"],
    ["/recipes/product-1", "Recipe"],
  ])("shows the title for %s", (pathname, title) => {
    navigationState.pathname = pathname;
    render(<SiteHeader />);

    expect(screen.getByRole("heading", { name: title })).toBeTruthy();
  });
});
