import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";

const { getBranchOptions, getDailyReportDetail, getDailyReportDirectory } =
  vi.hoisted(() => ({
    getBranchOptions: vi.fn(),
    getDailyReportDetail: vi.fn(),
    getDailyReportDirectory: vi.fn(),
  }));

vi.mock("server-only", () => ({}));
vi.mock("@/features/branch-products/services/branch-product-queries", () => ({
  getBranchOptions,
}));
vi.mock("@/features/business-day/services/business-day-queries", () => ({
  getBusinessToday: vi.fn().mockResolvedValue("2026-09-24"),
}));
vi.mock("./daily-report-queries", () => ({
  getDailyReportDetail,
  getDailyReportDirectory,
}));

import { loadDailyReportsView } from "./daily-report-page-loader";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const otherBranchId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const reportId = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const timestamp = "2026-09-24T02:00:00.000Z";
const directory = {
  items: [],
  total: 0,
  page: 1,
  page_size: 10,
  status_counts: { DRAFT: 0, SUBMITTED: 0, RETURNED: 0, APPROVED: 0 },
};
const report = {
  id: reportId,
  branch_id: branchId,
  business_date: "2000-01-01",
  status: "SUBMITTED",
  idempotency_key: reportId,
  created_by_user_id: reportId,
  submitted_by_user_id: reportId,
  submitted_at: timestamp,
  reviewed_by_user_id: null,
  reviewed_at: null,
  return_reason: null,
  completed_sales_amount: "0",
  completed_sales_count: 0,
  voided_sales_amount: "0",
  voided_sales_count: 0,
  created_at: timestamp,
  updated_at: timestamp,
  items: [],
  events: [],
};

function user(permissions: string[], branchIds: string[] = [branchId]) {
  return {
    id: reportId,
    email: "staff@example.com",
    full_name: "Branch Staff",
    contact_number: "",
    role: {
      id: "1",
      code: "BRANCH_STAFF",
      name: "Branch Staff",
      isSystem: false,
      isActive: true,
    },
    permissions,
    branch_ids: branchIds,
  };
}

const admin = {
  ...user([]),
  role: {
    id: "1",
    code: "SUPER_ADMIN",
    name: "Super Admin",
    isSystem: true,
    isActive: true,
  },
};

describe("daily report page loader", () => {
  beforeEach(() => {
    getBranchOptions.mockReset().mockResolvedValue([
      { id: branchId, name: "Downtown", status: "active" },
      { id: otherBranchId, name: "Airport", status: "inactive" },
    ]);
    getDailyReportDirectory.mockReset().mockResolvedValue(directory);
    getDailyReportDetail.mockReset().mockResolvedValue(report);
  });

  it("denies a user without the report read grant before loading data", async () => {
    await expect(loadDailyReportsView(user([]), {})).resolves.toEqual({
      status: "forbidden",
    });
    expect(getBranchOptions).not.toHaveBeenCalled();
    expect(getDailyReportDirectory).not.toHaveBeenCalled();
  });

  it("lists every branch first for Super Admin, who cannot create drafts", async () => {
    const result = await loadDailyReportsView(admin, {});
    expect(result).toMatchObject({
      status: "list",
      directory,
      createBranches: [],
      filters: { status: "all", sort: "newest", page: 1, pageSize: 10 },
    });
    expect(getDailyReportDirectory).toHaveBeenCalledWith(
      expect.not.objectContaining({ branchId: expect.anything() }),
    );
  });

  it("offers drafts only at active branches and rejects branches outside the user's scope", async () => {
    const result = await loadDailyReportsView(
      user(
        ["daily_reports.read", "daily_reports.create", "branches.read"],
        [branchId, otherBranchId],
      ),
      { status: "SUBMITTED" },
    );
    expect(result).toMatchObject({
      status: "list",
      createBranches: [{ id: branchId }],
    });

    await expect(
      loadDailyReportsView(user(["daily_reports.read", "branches.read"]), {
        branch_id: otherBranchId,
      }),
    ).resolves.toEqual({ status: "forbidden" });
  });

  it("returns to the last page when filters leave the requested page empty", async () => {
    getDailyReportDirectory.mockResolvedValue({
      ...directory,
      total: 12,
      page: 5,
    });
    await expect(
      loadDailyReportsView(admin, { status: "DRAFT", page: "5" }),
    ).resolves.toEqual({
      status: "redirect",
      href: "/reports?status=DRAFT&page=2",
    });
  });

  it("opens a report through its own branch and exposes the actions for its state", async () => {
    const result = await loadDailyReportsView(
      user([
        "daily_reports.read",
        "daily_reports.update",
        "daily_reports.approve",
        "daily_reports.return",
        "branches.read",
      ]),
      { report_id: reportId, report_branch: branchId, status: "SUBMITTED" },
    );
    expect(result).toMatchObject({
      status: "detail",
      selectedReport: report,
      canUpdate: false,
      canSubmit: false,
      canApprove: true,
      canReturn: true,
      filters: { status: "SUBMITTED", reportBranchId: branchId },
    });
    expect(getDailyReportDetail).toHaveBeenCalledWith(branchId, reportId);
    expect(getDailyReportDirectory).not.toHaveBeenCalled();
  });

  it("only enables submission for an ended day with a saved count for every item", async () => {
    const permissions = ["daily_reports.read", "daily_reports.submit"];
    getDailyReportDetail.mockResolvedValueOnce({
      ...report,
      status: "DRAFT",
      items: [{ stock_item_id: reportId, physical_closing_quantity: null }],
    });
    await expect(
      loadDailyReportsView(user(permissions), { report_id: reportId }),
    ).resolves.toMatchObject({
      status: "detail",
      canPrepareSubmission: true,
      canSubmit: false,
    });

    getDailyReportDetail.mockResolvedValueOnce({
      ...report,
      status: "DRAFT",
      items: [{ stock_item_id: reportId, physical_closing_quantity: "3.25" }],
    });
    await expect(
      loadDailyReportsView(user(permissions), { report_id: reportId }),
    ).resolves.toMatchObject({ status: "detail", canSubmit: true });
  });

  it("uses the API's development bypass without bypassing submission permissions", async () => {
    getDailyReportDetail.mockResolvedValue({
      ...report,
      status: "DRAFT",
      business_date: "2026-09-24",
      submission_checklist_bypassed: true,
      items: [{ stock_item_id: reportId, physical_closing_quantity: null }],
      shifts: [{ status: "OPEN" }, { status: "CLOSED" }],
    });
    await expect(
      loadDailyReportsView(
        user(["daily_reports.read", "daily_reports.submit"]),
        { report_id: reportId },
      ),
    ).resolves.toMatchObject({ canSubmit: true });
    await expect(
      loadDailyReportsView(user(["daily_reports.read"]), {
        report_id: reportId,
      }),
    ).resolves.toMatchObject({ canSubmit: false });
    getDailyReportDetail.mockResolvedValue({
      ...report,
      status: "DRAFT",
      business_date: "2026-09-24",
      submission_checklist_bypassed: false,
    });
    await expect(
      loadDailyReportsView(
        user(["daily_reports.read", "daily_reports.submit"]),
        { report_id: reportId },
      ),
    ).resolves.toMatchObject({ canSubmit: false });
  });

  it("allows an ended report without count items to be submitted", async () => {
    getDailyReportDetail.mockResolvedValue({
      ...report,
      status: "DRAFT",
      items: [],
    });
    await expect(
      loadDailyReportsView(
        user(["daily_reports.read", "daily_reports.submit"]),
        { report_id: reportId },
      ),
    ).resolves.toMatchObject({ canSubmit: true });
  });

  it("converts an expired session into a session state", async () => {
    getDailyReportDirectory.mockRejectedValueOnce(
      new ApiRequestError("expired", 401),
    );
    await expect(
      loadDailyReportsView(user(["daily_reports.read"]), {}),
    ).resolves.toEqual({ status: "session-expired" });
  });
});
