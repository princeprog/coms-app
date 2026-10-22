// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type {
  DailyReportsDetailView,
  DailyReportsListView,
} from "@/features/daily-reports/services/daily-report-page-loader";
import { DailyReportsManagement } from "./daily-reports-management";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
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

const north = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const south = "3fa85f64-5717-4562-b3fc-2c963f66afa5";
const reportId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const branches = [
  { id: north, name: "Manila North", status: "active" as const },
  { id: south, name: "Cebu South", status: "active" as const },
];
const row = {
  id: reportId,
  branch_id: south,
  branch_name: "Cebu South",
  branch_status: "active",
  business_date: "2026-09-23",
  status: "SUBMITTED" as const,
  completed_sales_amount: "12500.5",
  completed_sales_count: 41,
  voided_sales_count: 1,
  submitted_at: "2026-09-24T02:00:00.000Z",
  submitted_by_name: "Ana Reyes",
  reviewed_at: null,
  reviewed_by_name: null,
  updated_at: "2026-09-24T02:00:00.000Z",
  item_count: 12,
  counted_count: 12,
  variance_count: 3,
};
const listView: DailyReportsListView = {
  status: "list",
  filters: { status: "all", sort: "newest", page: 1, pageSize: 10 },
  branchOptions: branches,
  directory: {
    items: [row],
    total: 1,
    page: 1,
    page_size: 10,
    status_counts: { DRAFT: 2, SUBMITTED: 1, RETURNED: 0, APPROVED: 4 },
  },
  todayManila: "2026-09-24",
  createBranches: [],
};

describe("daily reports management", () => {
  it("lists reports from every branch with review details and status counts", async () => {
    render(<DailyReportsManagement view={listView} />);

    const table = screen.getByRole("table", { name: "Daily reports" });
    const cells = within(table).getAllByRole("row")[1]!;
    expect(within(cells).getByText("Cebu South")).toBeTruthy();
    expect(within(cells).getByText("Submitted")).toBeTruthy();
    expect(within(cells).getByText("12 of 12")).toBeTruthy();
    expect(within(cells).getByText("3 items")).toBeTruthy();
    expect(within(cells).getByText("₱12,500.50")).toBeTruthy();
    expect(
      within(cells)
        .getByRole("link", { name: "Sep 23, 2026" })
        .getAttribute("href"),
    ).toBe(`/reports?report_id=${reportId}&report_branch=${south}`);
    expect(
      screen
        .getByRole("button", { name: /^All\s*7$/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /^Submitted/ }));
    expect(replace).toHaveBeenCalledWith("/reports?status=SUBMITTED", {
      scroll: false,
    });
    expect(screen.queryByText("Create report fixture")).toBeNull();
    expect(screen.queryByRole("button", { name: /Export/ })).toBeNull();
  });

  it("explains an empty filtered list and offers to clear it", async () => {
    render(
      <DailyReportsManagement
        view={{
          ...listView,
          filters: { ...listView.filters, status: "RETURNED", branchId: north },
          directory: { ...listView.directory, items: [], total: 0 },
        }}
      />,
    );
    expect(screen.getByText("No reports match these filters")).toBeTruthy();
    replace.mockReset();
    await userEvent
      .setup()
      .click(screen.getAllByRole("button", { name: "Clear filters" }).at(-1)!);
    expect(replace).toHaveBeenCalledWith("/reports", { scroll: false });
  });

  it("returns from a report to the same filtered list", () => {
    const detail: DailyReportsDetailView = {
      status: "detail",
      filters: {
        status: "SUBMITTED",
        sort: "newest",
        page: 3,
        pageSize: 10,
        reportId,
        reportBranchId: north,
      },
      selectedBranch: branches[0]!,
      selectedReport: {
        id: reportId,
        branch_id: north,
        business_date: "2026-09-23",
        status: "SUBMITTED",
        idempotency_key: reportId,
        created_by_user_id: reportId,
        submitted_by_user_id: reportId,
        submitted_at: "2026-09-24T02:00:00.000Z",
        reviewed_by_user_id: null,
        reviewed_at: null,
        return_reason: null,
        completed_sales_amount: "0",
        completed_sales_count: 0,
        voided_sales_amount: "0",
        voided_sales_count: 0,
        created_at: "2026-09-24T02:00:00.000Z",
        updated_at: "2026-09-24T02:00:00.000Z",
        items: [],
        events: [],
      },
      detailIssue: null,
      canUpdate: false,
      canPrepareSubmission: false,
      canSubmit: false,
      canApprove: true,
      canReturn: true,
    };
    render(<DailyReportsManagement view={detail} />);

    expect(
      screen.getByText("Selected report fixture · 2026-09-23"),
    ).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Back to reports" })
        .getAttribute("href"),
    ).toBe("/reports?status=SUBMITTED&page=3");
  });
});
