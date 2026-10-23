// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DashboardExceptions } from "../schemas/dashboard-exceptions.schema";
import { ExceptionTrends } from "./exception-trends";

const { getDashboardExceptionsAction } = vi.hoisted(() => ({
  getDashboardExceptionsAction: vi.fn(),
}));
vi.mock("../services/dashboard-exceptions-actions", () => ({
  getDashboardExceptionsAction,
}));

const weekStarts = ["2026-09-26", "2026-10-03", "2026-10-10", "2026-10-17"];
const week = (index: number, patch: Record<string, unknown> = {}) => ({
  week_start: weekStarts[index],
  shortage_lines: 0,
  uncosted_shortage_lines: 0,
  shortage_value: "0.00",
  cash_short_shifts: 0,
  cash_short_amount: "0.00",
  receiving_differences: 0,
  void_count: 0,
  void_amount: "0.00",
  ...patch,
});

function trends(patch: Partial<DashboardExceptions> = {}): DashboardExceptions {
  return {
    week_starts: weekStarts,
    access: {
      shortages: true,
      shortage_values: true,
      cash: true,
      receiving: true,
      cashiers: true,
    },
    branches: [
      {
        branch_id: "b1",
        branch_name: "Cebu Branch",
        weeks: [
          week(0, { shortage_lines: 1, shortage_value: "120.10" }),
          week(1),
          week(2, { cash_short_shifts: 1, cash_short_amount: "50.00" }),
          week(3, {
            shortage_lines: 3,
            shortage_value: "960.25",
            void_count: 2,
            void_amount: "300.00",
          }),
        ],
      },
    ],
    cashiers: {
      total: 30,
      items: [
        {
          user_id: "u1",
          full_name: "Ben Reyes",
          branches: ["Cebu Branch"],
          shifts: 10,
          short_shifts: 4,
          short_amount: "380.00",
          over_shifts: 1,
          over_amount: "20.00",
          sales_count: 120,
          void_count: 3,
          void_amount: "450.00",
        },
        {
          user_id: "u2",
          full_name: "Ana Cruz",
          branches: ["Cebu Branch", "Manila - Ermita"],
          shifts: 10,
          short_shifts: 1,
          short_amount: "20.00",
          over_shifts: 0,
          over_amount: "0.00",
          sales_count: 90,
          void_count: 0,
          void_amount: "0.00",
        },
      ],
    },
    ...patch,
  };
}

function mount() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ExceptionTrends branchId="b1" />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  getDashboardExceptionsAction.mockReset();
  getDashboardExceptionsAction.mockResolvedValue({ ok: true, data: trends() });
});

describe("exception trends", () => {
  it("totals each branch's weeks and marks a rising last week", async () => {
    mount();
    const table = await screen.findByRole("region", {
      name: "Exceptions by branch table",
    });
    expect(getDashboardExceptionsAction).toHaveBeenCalledWith("b1");
    const cells = within(table).getAllByRole("cell");
    // Shortages: 4 lines, ₱1,080.35 exact, and up against earlier weeks.
    expect(cells[1].textContent).toContain("4");
    expect(cells[1].textContent).toContain("₱1,080.35 short");
    expect(cells[1].textContent).toContain("Up");
    expect(cells[1].textContent).toContain(
      "Count shortages by week: week of Sat, Sep 26 1, week of Sat, Oct 3 0",
    );
    // Cash shortage was only in an earlier week, so it is not rising.
    expect(cells[2].textContent).toContain("₱50.00 short");
    expect(cells[2].textContent).not.toContain("Up");
    expect(cells[4].textContent).toContain("₱300.00");
  });

  it("switches to cashiers by keyboard and flags frequent shortages", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole("region", { name: "Exceptions by branch table" });
    screen.getByRole("tab", { name: "By branch" }).focus();
    await user.keyboard("{ArrowRight}{Enter}");
    const table = await screen.findByRole("region", {
      name: "Exceptions by cashier table",
    });
    const ben = within(table).getByText("Ben Reyes").closest("tr")!;
    expect(ben.textContent).toContain("4 of 10");
    expect(within(ben).getByText("Frequent")).toBeTruthy();
    expect(ben.textContent).toContain("3 of 120 sales");
    const ana = within(table).getByText("Ana Cruz").closest("tr")!;
    expect(within(ana).queryByText("Frequent")).toBeNull();
    expect(ana.textContent).toContain("Cebu Branch, Manila - Ermita");
    expect(screen.getByText(/Showing the 2 cashiers/)).toBeTruthy();
  });

  it("hides metrics and the cashier view the user cannot see", async () => {
    getDashboardExceptionsAction.mockResolvedValue({
      ok: true,
      data: trends({
        access: {
          shortages: true,
          shortage_values: false,
          cash: false,
          receiving: false,
          cashiers: false,
        },
        cashiers: null,
      }),
    });
    mount();
    const table = await screen.findByRole("region", {
      name: "Exceptions by branch table",
    });
    expect(within(table).queryByText("Cash short shifts")).toBeNull();
    expect(within(table).queryByText("Receiving differences")).toBeNull();
    expect(table.textContent).not.toContain("₱1,080.35");
    expect(table.textContent).not.toContain("₱50.00");
    expect(screen.queryByRole("tab")).toBeNull();
  });

  it("explains a failed load and retries", async () => {
    getDashboardExceptionsAction.mockResolvedValueOnce({
      ok: false,
      error: "COMS could not load exception trends. Try again.",
    });
    mount();
    expect(
      await screen.findByText(
        "COMS could not load exception trends. Try again.",
      ),
    ).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("region", { name: "Exceptions by branch table" }),
    ).toBeTruthy();
  });
});
