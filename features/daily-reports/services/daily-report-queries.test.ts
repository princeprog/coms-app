import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookies, requestComsApi } = vi.hoisted(() => ({
  cookies: vi.fn(),
  requestComsApi: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies }));
vi.mock("@/services/server-api-services", () => ({ requestComsApi }));

import {
  getDailyReportDetail,
  getDailyReportDirectory,
} from "./daily-report-queries";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const reportId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const counts = { DRAFT: 0, SUBMITTED: 0, RETURNED: 0, APPROVED: 0 };

describe("daily report queries", () => {
  beforeEach(() => {
    cookies.mockResolvedValue({ toString: () => "coms_access=access-token" });
    requestComsApi.mockReset();
  });

  it("loads the cross-branch directory with every applied filter", async () => {
    const page = {
      items: [],
      total: 0,
      page: 2,
      page_size: 30,
      status_counts: counts,
    };
    requestComsApi.mockResolvedValue(page);

    await expect(
      getDailyReportDirectory({
        branchId,
        status: "SUBMITTED",
        dateFrom: "2026-09-01",
        dateTo: "2026-09-30",
        sort: "oldest",
        page: 2,
        pageSize: 30,
      }),
    ).resolves.toEqual(page);
    expect(requestComsApi).toHaveBeenCalledWith(
      `/daily-reports?page=2&page_size=30&sort=oldest&branch_id=${branchId}&status=SUBMITTED&date_from=2026-09-01&date_to=2026-09-30`,
      { cookieHeader: "coms_access=access-token" },
    );
  });

  it("rejects a directory response for another page", async () => {
    requestComsApi.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
      status_counts: counts,
    });
    await expect(
      getDailyReportDirectory({
        status: "all",
        sort: "newest",
        page: 3,
        pageSize: 10,
      }),
    ).rejects.toMatchObject({ status: 502 });
  });

  it("loads a validated report detail through its branch endpoint", async () => {
    const report = {
      id: reportId,
      branch_id: branchId,
      business_date: "2026-09-23",
      status: "DRAFT",
      idempotency_key: reportId,
      created_by_user_id: reportId,
      submitted_by_user_id: null,
      submitted_at: null,
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
    };
    requestComsApi.mockResolvedValue(report);

    await expect(getDailyReportDetail(branchId, reportId)).resolves.toEqual(
      report,
    );
    expect(requestComsApi).toHaveBeenCalledWith(
      `/branches/${branchId}/daily-reports/${reportId}`,
      { cookieHeader: "coms_access=access-token" },
    );
    await expect(getDailyReportDetail("bad", reportId)).rejects.toMatchObject({
      status: 404,
    });
  });
});
