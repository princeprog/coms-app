// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DailyReportsViewResult } from "@/features/daily-reports/services/daily-report-page-loader";
import { DailyReportsManagement } from "./daily-reports-management";

vi.mock("./daily-report-list", () => ({
  DailyReportList: () => <div>Reports directory fixture</div>,
}));
vi.mock("./daily-report-create-form", () => ({
  DailyReportCreateForm: () => <div>Create report fixture</div>,
}));
vi.mock("./daily-report-detail", () => ({
  DailyReportDetail: ({ report }: { report: { business_date: string } }) => (
    <div>Selected report fixture · {report.business_date}</div>
  ),
}));
vi.mock("@/features/daily-reports/services/daily-report-actions", () => ({
  approveDailyReportAction: vi.fn(),
  createDailyReportAction: vi.fn(),
  returnDailyReportAction: vi.fn(),
  submitDailyReportAction: vi.fn(),
  updateDailyReportAction: vi.fn(),
}));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const reportId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const readyView = {
  status: "ready",
  filters: { branchId, reportId, status: "SUBMITTED", page: 3 },
  branchOptions: [{ id: branchId, name: "Manila North", status: "active" }],
  selectedBranch: { id: branchId, name: "Manila North", status: "active" },
  page: { items: [], total: 0, page: 3, page_size: 25 },
  selectedReport: {
    id: reportId,
    branch_id: branchId,
    business_date: "2026-09-23",
    status: "SUBMITTED",
    idempotency_key: reportId,
    created_by_user_id: reportId,
    submitted_by_user_id: reportId,
    submitted_at: "2026-09-24T02:00:00.000Z",
    reviewed_by_user_id: null,
    reviewed_at: null,
    return_reason: null,
    created_at: "2026-09-24T02:00:00.000Z",
    updated_at: "2026-09-24T02:00:00.000Z",
    items: [],
    events: [],
  },
  detailIssue: null,
  todayManila: "2026-09-24",
  canCreate: true,
  canUpdate: false,
  canSubmit: false,
  canApprove: true,
  canReturn: true,
} as DailyReportsViewResult;

describe("daily reports management", () => {
  it("replaces the directory with the selected report and preserves filters on return", () => {
    if (readyView.status !== "ready") throw new Error("Fixture must be ready.");
    render(<DailyReportsManagement view={readyView} />);

    expect(
      screen.getByText("Selected report fixture · 2026-09-23"),
    ).toBeTruthy();
    expect(screen.queryByText("Reports directory fixture")).toBeNull();
    expect(screen.queryByText("Create report fixture")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Back to reports" })
        .getAttribute("href"),
    ).toBe(`/reports?branch_id=${branchId}&status=SUBMITTED&page=3`);
  });
});
