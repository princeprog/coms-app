import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";

const { getBranchOptions, getDailyReportDetail, getDailyReportPageData } =
  vi.hoisted(() => ({
    getBranchOptions: vi.fn(),
    getDailyReportDetail: vi.fn(),
    getDailyReportPageData: vi.fn(),
  }));

vi.mock("server-only", () => ({}));
vi.mock("@/features/branch-products/services/branch-product-queries", () => ({
  getBranchOptions,
}));
vi.mock("./daily-report-queries", () => ({
  getDailyReportDetail,
  getDailyReportPageData,
}));

async function getLoader() {
  return import("./daily-report-page-loader").catch(() => null);
}

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const otherBranchId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const reportId = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const timestamp = "2026-09-24T02:00:00.000Z";
const page = { items: [], total: 0, page: 1, page_size: 25 };
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

describe("daily report page loader", () => {
  beforeEach(() => {
    getBranchOptions.mockReset().mockResolvedValue([
      { id: branchId, name: "Downtown", status: "active" },
      { id: otherBranchId, name: "Airport", status: "active" },
    ]);
    getDailyReportPageData.mockReset().mockResolvedValue(page);
    getDailyReportDetail.mockReset().mockResolvedValue(report);
  });

  it("denies a user without the report read grant before loading branch data", async () => {
    const loader = await getLoader();
    expect(loader).not.toBeNull();
    if (!loader) return;

    await expect(loader.loadDailyReportsView(user([]), {})).resolves.toEqual({
      status: "forbidden",
    });
    expect(getBranchOptions).not.toHaveBeenCalled();
    expect(getDailyReportPageData).not.toHaveBeenCalled();
  });

  it("limits selected branches to the signed-in user's assignments", async () => {
    const loader = await getLoader();
    expect(loader).not.toBeNull();
    if (!loader) return;

    await expect(
      loader.loadDailyReportsView(
        user(["daily_reports.read", "branches.read"]),
        {
          branch_id: otherBranchId,
        },
      ),
    ).resolves.toEqual({ status: "forbidden" });
    expect(getDailyReportPageData).not.toHaveBeenCalled();
  });

  it("loads a report and exposes only the actions granted for its current state", async () => {
    const loader = await getLoader();
    expect(loader).not.toBeNull();
    if (!loader) return;

    const result = await loader.loadDailyReportsView(
      user([
        "daily_reports.read",
        "daily_reports.create",
        "daily_reports.update",
        "daily_reports.submit",
        "daily_reports.approve",
        "daily_reports.return",
        "branches.read",
      ]),
      { branch_id: branchId, report_id: reportId, status: "SUBMITTED" },
    );

    expect(result).toMatchObject({
      status: "ready",
      page,
      selectedReport: report,
      canCreate: true,
      canUpdate: false,
      canSubmit: false,
      canApprove: true,
      canReturn: true,
    });
    expect(getDailyReportPageData).toHaveBeenCalledWith({
      branchId,
      page: 1,
      status: "SUBMITTED",
    });
    expect(getDailyReportDetail).toHaveBeenCalledWith(branchId, reportId);
  });

  it("converts expired sessions from protected report requests into a session state", async () => {
    const loader = await getLoader();
    expect(loader).not.toBeNull();
    if (!loader) return;
    getDailyReportPageData.mockRejectedValueOnce(
      new ApiRequestError("expired", 401),
    );

    await expect(
      loader.loadDailyReportsView(user(["daily_reports.read"]), {}),
    ).resolves.toEqual({ status: "session-expired" });
  });
});
