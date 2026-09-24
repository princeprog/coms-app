// @vitest-environment jsdom
import type { ReactElement, ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationState = vi.hoisted(() => ({
  pathname: "/receipts/receipt-1",
  isMobile: true,
  setOpenMobile: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({
      href,
      onNavigate,
      children,
      ...props
    }: {
      href: string;
      onNavigate?: () => void;
      children: ReactNode;
      [key: string]: unknown;
    }) =>
      React.createElement(
        "a",
        {
          ...props,
          href,
          onClick: (event: MouseEvent) => {
            event.preventDefault();
            if (
              event.button === 0 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey
            ) {
              onNavigate?.();
            }
          },
        },
        children,
      ),
  };
});

vi.mock("@/components/ui/sidebar", async () => {
  const React = await import("react");
  const wrapper = (tag: string) =>
    function Wrapper({ children }: { children: ReactNode }) {
      return React.createElement(tag, null, children);
    };

  return {
    SidebarGroup: wrapper("div"),
    SidebarGroupContent: wrapper("div"),
    SidebarMenu: wrapper("ul"),
    SidebarMenuItem: wrapper("li"),
    SidebarMenuButton: ({
      render,
      isActive,
      children,
    }: {
      render: ReactElement;
      isActive?: boolean;
      children: ReactNode;
    }) => React.cloneElement(render, { "data-active": isActive }, children),
    useSidebar: () => ({
      isMobile: navigationState.isMobile,
      setOpenMobile: navigationState.setOpenMobile,
    }),
  };
});

import { NavMain } from "./nav-main";

describe("NavMain client navigation", () => {
  beforeEach(() => {
    navigationState.pathname = "/receipts/receipt-1";
    navigationState.isMobile = true;
    navigationState.setOpenMobile.mockReset();
  });

  it("uses a client link and marks a section active on its detail route", () => {
    render(
      <NavMain
        items={[
          { title: "Receiving", url: "/receipts" },
          { title: "Inventory", url: "/inventory" },
        ]}
      />,
    );

    const receiving = screen.getByRole("link", { name: "Receiving" });
    expect(receiving.getAttribute("href")).toBe("/receipts");
    expect(receiving.getAttribute("aria-current")).toBe("page");
    expect(
      screen
        .getByRole("link", { name: "Inventory" })
        .getAttribute("aria-current"),
    ).toBeNull();
  });

  it("closes the mobile sidebar after a same-tab route navigation", () => {
    render(<NavMain items={[{ title: "Receiving", url: "/receipts" }]} />);

    fireEvent.click(screen.getByRole("link", { name: "Receiving" }));

    expect(navigationState.setOpenMobile).toHaveBeenCalledWith(false);
  });

  it("keeps the mobile sidebar open when the link opens another tab", () => {
    render(<NavMain items={[{ title: "Receiving", url: "/receipts" }]} />);

    fireEvent.click(screen.getByRole("link", { name: "Receiving" }), {
      ctrlKey: true,
    });

    expect(navigationState.setOpenMobile).not.toHaveBeenCalled();
  });
});
