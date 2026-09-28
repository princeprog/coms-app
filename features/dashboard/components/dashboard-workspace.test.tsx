// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { authTestSessionUser } from "@/test/auth-fixtures";
import type { DashboardData } from "@/features/dashboard/schemas/dashboard.schema";
import { DashboardWorkspace } from "./dashboard-workspace";

const { getBranchDashboardAction, getGlobalDashboardAction } = vi.hoisted(
  () => ({
    getBranchDashboardAction: vi.fn(),
    getGlobalDashboardAction: vi.fn(),
  }),
);

vi.mock("@/features/dashboard/services/dashboard-actions", () => ({
  getBranchDashboardAction,
  getGlobalDashboardAction,
}));
vi.mock("./dashboard-sales-trend", () => ({
  DashboardSalesTrend: () => <div data-testid="sales-trend" />,
}));

const branchA = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const branchB = "550e8400-e29b-41d4-a716-446655440000";
const initialRange = { from: "2026-08-31", to: "2026-09-29" };

function dashboard(branchId: string, name: string): DashboardData {
  const summary = {
    completed_sales_amount: "120.50",
    completed_sales_count: 4,
    voided_sales_amount: "10",
    voided_sales_count: 1,
    units_sold: "8.5",
    submitted_reports_count: 2,
    approved_reports_count: 1,
    open_discrepancies_count: 1,
    in_transit_dispatches_count: 2,
  };
  return {
    period: { ...initialRange, time_zone: "Asia/Manila" },
    summary,
    sales_trend: [],
    branches: [
      {
        ...summary,
        branch_id: branchId,
        branch_name: name,
        branch_status: "active",
      },
    ],
  };
}

function renderWorkspace(
  user = authTestSessionUser,
  requestedBranchId?: string,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <DashboardWorkspace
        user={user}
        requestedBranchId={requestedBranchId}
        initialRange={initialRange}
      />
    </QueryClientProvider>,
  );
}

describe("dashboard workspace", () => {
  it("explains the branch assignment requirement without requesting global data", () => {
    renderWorkspace({
      ...authTestSessionUser,
      permissions: ["dashboard.read"],
      branch_ids: [],
    });

    expect(screen.getByText("No branch assigned")).toBeTruthy();
    expect(getBranchDashboardAction).not.toHaveBeenCalled();
    expect(getGlobalDashboardAction).not.toHaveBeenCalled();
  });

  it("loads only the assigned branch dashboard for a branch-scoped user", async () => {
    getBranchDashboardAction.mockResolvedValue({
      ok: true,
      data: dashboard(branchA, "Banilad"),
    });
    renderWorkspace({
      ...authTestSessionUser,
      permissions: ["dashboard.read"],
      branch_ids: [branchA],
    });

    expect(await screen.findByText("Banilad")).toBeTruthy();
    expect(screen.getByText("120.5")).toBeTruthy();
    expect(getBranchDashboardAction).toHaveBeenCalledWith(
      branchA,
      initialRange,
    );
    expect(getGlobalDashboardAction).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Location")).toBeNull();
  });

  it("keeps global branch choices and loads one branch when selected", async () => {
    const allBranches: DashboardData = {
      ...dashboard(branchA, "Banilad"),
      branches: [
        dashboard(branchA, "Banilad").branches[0]!,
        dashboard(branchB, "Mandaue").branches[0]!,
      ],
    };
    getGlobalDashboardAction
      .mockResolvedValueOnce({ ok: true, data: allBranches })
      .mockResolvedValueOnce({ ok: true, data: dashboard(branchB, "Mandaue") });
    const user = userEvent.setup();
    renderWorkspace({
      ...authTestSessionUser,
      permissions: ["dashboard.global_read"],
      branch_ids: [],
    });

    expect((await screen.findAllByText("Banilad")).length).toBeGreaterThan(0);
    await user.click(screen.getByLabelText("Location"));
    await user.click(await screen.findByRole("option", { name: "Mandaue" }));
    await waitFor(() =>
      expect(getGlobalDashboardAction).toHaveBeenLastCalledWith({
        ...initialRange,
        branch_id: branchB,
      }),
    );
    expect((await screen.findAllByText("Mandaue")).length).toBeGreaterThan(0);
  });
});
