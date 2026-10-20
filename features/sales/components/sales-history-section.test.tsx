// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { SalesHistorySection } from "./sales-history-section";
import type { SalePage } from "../types/sale.types";
const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const page: SalePage = {
  items: [
    {
      id,
      sale_reference: "S-000123",
      branch_id: id,
      cashier_user_id: id,
      cashier_name: "Maria Santos",
      status: "COMPLETED",
      service_type: "DINE_IN",
      tender_method: "Cash",
      total_amount: "20",
      idempotency_key: id,
      created_at: "2026-10-20T00:00:00Z",
    },
  ],
  total: 31,
  page: 2,
  page_size: 10,
  summary: { net_sales: "620", completed_sales: 31, voided_sales: 0 },
  payment_methods: ["Cash", "GCash"],
};
const filters = {
  branchId: id,
  page: 3,
  search: "chicken",
  historyPage: 2,
  historyPeriod: "all" as const,
  view: "history" as const,
};
beforeEach(() => {
  replace.mockReset();
  refresh.mockReset();
});
it("uses server totals and preserves checkout filters while combining a pending search with a status filter", async () => {
  const user = userEvent.setup();
  render(
    <SalesHistorySection
      page={page}
      filters={filters}
      canVoid={false}
      voidAction={vi.fn()}
    />,
  );
  expect(screen.getByText("₱620.00")).toBeTruthy();
  await user.type(
    screen.getByRole("searchbox", { name: "Search sales" }),
    "Maria",
  );
  await user.click(screen.getByRole("combobox", { name: "Sale status" }));
  await user.click(screen.getByRole("option", { name: "Completed" }));
  await waitFor(() => expect(replace).toHaveBeenCalled());
  const params = new URL(replace.mock.calls.at(-1)![0], "http://localhost")
    .searchParams;
  expect(params.get("history_search")).toBe("Maria");
  expect(params.get("history_status")).toBe("COMPLETED");
  expect(params.get("history_page")).toBeNull();
  expect(params.get("page")).toBe("3");
  expect(params.get("search")).toBe("chicken");
});
it("keeps rows per page beside pagination and resets only history pagination", async () => {
  const user = userEvent.setup();
  render(
    <SalesHistorySection
      page={page}
      filters={filters}
      canVoid={false}
      voidAction={vi.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Next sales page" }));
  expect(
    new URL(replace.mock.calls.at(-1)![0], "http://localhost").searchParams.get(
      "history_page",
    ),
  ).toBe("3");
  await user.click(screen.getByRole("combobox", { name: "Rows per page" }));
  await user.click(screen.getByRole("option", { name: "30" }));
  const params = new URL(replace.mock.calls.at(-1)![0], "http://localhost")
    .searchParams;
  expect(params.get("history_page_size")).toBe("30");
  expect(params.get("history_page")).toBeNull();
  expect(params.get("page")).toBe("3");
});
it("offers authorized voiding in the action menu and requires a reason before writing", async () => {
  const user = userEvent.setup();
  const action = vi.fn().mockResolvedValue({ ok: true });
  render(
    <SalesHistorySection
      page={page}
      filters={filters}
      canVoid
      voidAction={action}
    />,
  );
  screen.getByRole("button", { name: "Actions for S-000123" }).focus();
  await user.keyboard("{Enter}");
  await user.click(screen.getByRole("menuitem", { name: "Void sale" }));
  expect(
    await screen.findByRole("alertdialog", { name: "Void S-000123?" }),
  ).toBeTruthy();
  expect(action).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Confirm void" })).toHaveProperty(
    "disabled",
    true,
  );
  await user.type(
    screen.getByRole("textbox", { name: "Void reason" }),
    "Duplicate order",
  );
  await user.click(screen.getByRole("button", { name: "Confirm void" }));
  await waitFor(() =>
    expect(action).toHaveBeenCalledWith(
      id,
      id,
      { reason: "Duplicate order" },
      expect.any(String),
    ),
  );
  expect(refresh).toHaveBeenCalledOnce();
});
it("keeps failed history distinct from an empty result and offers retry", async () => {
  const user = userEvent.setup();
  render(
    <SalesHistorySection
      page={null}
      filters={filters}
      canVoid={false}
      voidAction={vi.fn()}
    />,
  );
  expect(screen.getByRole("alert").textContent).toContain("couldn’t be loaded");
  expect(screen.queryByText("₱0.00")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Retry sales" }));
  expect(refresh).toHaveBeenCalledOnce();
});
