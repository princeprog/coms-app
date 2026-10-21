// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditLogWorkspace } from "./audit-log-workspace";

const { params, replace, getAuditEventsAction } = vi.hoisted(() => ({
  params: { value: new URLSearchParams() },
  replace: vi.fn(),
  getAuditEventsAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/audit-log",
  useSearchParams: () => params.value,
}));
vi.mock("../services/audit-actions", () => ({ getAuditEventsAction }));

const priceChange = {
  id: "00000000-0000-4000-8000-000000000001",
  occurred_at: "2026-10-21T13:23:00.000Z",
  actor_user_id: "00000000-0000-4000-8000-000000000009",
  actor_name: "Maria Santos",
  action: "product.updated",
  entity_type: "product",
  entity_id: "00000000-0000-4000-8000-000000000002",
  entity_label: "Tapsilog",
  branch_id: null,
  changes: {
    price: { from: "150.00", to: "169.00" },
    category_id: { from: "Rice meals", to: "Silog meals" },
  },
  metadata: {},
};
const failedSignIn = {
  ...priceChange,
  id: "00000000-0000-4000-8000-000000000003",
  actor_user_id: null,
  actor_name: null,
  action: "auth.sign_in_failed",
  entity_type: "staff",
  entity_label: "Maria Santos",
  changes: {},
  metadata: { email: "maria@example.com" },
};

function mount(search = "") {
  params.value = new URLSearchParams(search);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuditLogWorkspace />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  replace.mockReset();
  getAuditEventsAction.mockReset();
  getAuditEventsAction.mockResolvedValue({
    ok: true,
    data: {
      items: [priceChange, failedSignIn],
      total: 2,
      page: 1,
      page_size: 10,
    },
  });
});

describe("audit log", () => {
  it("lists events in plain language and passes URL filters", async () => {
    mount("area=product&from=2026-10-01&to=2026-10-21&search=tap");
    expect(await screen.findByText("Updated product")).toBeTruthy();
    expect(screen.getByText("Price, Category")).toBeTruthy();
    expect(screen.getByText("Failed sign-in")).toBeTruthy();
    expect(screen.getByText("System")).toBeTruthy();
    expect(getAuditEventsAction).toHaveBeenCalledWith({
      area: "product",
      from: "2026-10-01",
      to: "2026-10-21",
      search: "tap",
      page: 1,
      page_size: 10,
    });
  });

  it("shows field changes in a side sheet", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(
      await screen.findByRole("button", {
        name: "Actions for Updated product on Tapsilog",
      }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "View details" }),
    );
    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText("Maria Santos")).toBeTruthy();
    expect(within(sheet).getByText("₱150.00")).toBeTruthy();
    expect(within(sheet).getByText("₱169.00")).toBeTruthy();
    expect(within(sheet).getByText("Silog meals")).toBeTruthy();
  });

  it("explains an empty filtered result and a failed load", async () => {
    getAuditEventsAction.mockResolvedValueOnce({
      ok: true,
      data: { items: [], total: 0, page: 1, page_size: 10 },
    });
    mount("search=nobody");
    expect(await screen.findByText("No events match")).toBeTruthy();

    getAuditEventsAction.mockResolvedValueOnce({
      ok: false,
      error: "You don't have access to the audit log.",
    });
    mount("area=role");
    expect(
      await screen.findByText("You don't have access to the audit log."),
    ).toBeTruthy();
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Try again" })).toHaveLength(
        1,
      ),
    );
  });
});
