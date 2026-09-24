// @vitest-environment jsdom
import type { ReactNode } from "react";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authTestSessionUser } from "@/test/auth-fixtures";
import { CatalogManagement } from "@/features/catalogs/components/catalog-management";
import type { CatalogPage } from "@/features/catalogs/types/catalog.types";

const { route, sidebarRenders, refresh } = vi.hoisted(() => ({
  route: { pathname: "/dashboard" },
  sidebarRenders: { count: 0 },
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useRouter: () => ({ refresh }),
}));

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
    refresh.mockReset();
  });

  it("keeps the sidebar mounted across navigation and an in-place page refresh", () => {
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

    const rendersBeforeRefresh = sidebarRenders.count;
    view.rerender(
      <AuthenticatedAppShell user={authTestSessionUser}>
        <p>Updated receipt data</p>
      </AuthenticatedAppShell>,
    );

    expect(screen.getByTestId("sidebar")).toBe(sidebarBeforeNavigation);
    expect(sidebarRenders.count).toBe(rendersBeforeRefresh);
    expect(screen.getByText("Updated receipt data")).toBeTruthy();
    expect(screen.queryByText("Receipt content")).toBeNull();
  });

  it("keeps the sidebar node through a catalog mutation refresh", async () => {
    const user = userEvent.setup();
    const supplier = {
      id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      supplier_name: "North Farm Supply",
      is_active: true,
    };
    const createAction = vi.fn().mockResolvedValue({ ok: true as const });
    const updateAction = vi.fn().mockResolvedValue({ ok: true as const });
    const deactivateAction = vi.fn().mockResolvedValue({ ok: true as const });

    function CatalogPage() {
      const [page, setPage] = useState<CatalogPage>({
        items: [],
        total: 0,
        page: 1,
        page_size: 25,
      });
      refresh.mockImplementation(() =>
        setPage({ items: [supplier], total: 1, page: 1, page_size: 25 }),
      );

      return (
        <AuthenticatedAppShell user={authTestSessionUser}>
          <CatalogManagement
            title="Suppliers"
            resourceName="supplier"
            description="Maintain supplier contact details."
            routePath="/suppliers"
            displayColumns={[{ key: "supplier_name", label: "Supplier" }]}
            fields={[
              {
                key: "supplier_name",
                label: "Supplier name",
                required: true,
                maxLength: 160,
              },
            ]}
            page={page}
            search=""
            activeFilter="all"
            canCreate
            canUpdate
            canDeactivate
            createAction={createAction}
            updateAction={updateAction}
            deactivateAction={deactivateAction}
          />
        </AuthenticatedAppShell>
      );
    }

    render(<CatalogPage />);
    const sidebarBeforeMutation = screen.getByTestId("sidebar");

    await user.click(screen.getByRole("button", { name: "Add supplier" }));
    await user.type(
      screen.getByLabelText("Supplier name"),
      supplier.supplier_name,
    );
    await user.click(screen.getByRole("button", { name: "Create supplier" }));

    expect(await screen.findByText(supplier.supplier_name)).toBeTruthy();
    expect(createAction).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("sidebar")).toBe(sidebarBeforeMutation);
    expect(sidebarRenders.count).toBe(1);
  });
});
