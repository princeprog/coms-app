import { describe, expect, it } from "vitest";
import {
  createDailyReportHref,
  listFilters,
  parseDailyReportPageFilters,
} from "./daily-report-page-params";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const reportId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";

describe("daily report page parameters", () => {
  it("defaults to every branch, newest first, ten rows", () => {
    expect(parseDailyReportPageFilters({})).toEqual({
      status: "all",
      sort: "newest",
      page: 1,
      pageSize: 10,
    });
  });

  it("normalizes list filters and the opened report", () => {
    expect(
      parseDailyReportPageFilters({
        branch_id: branchId.toUpperCase(),
        report_id: reportId,
        report_branch: branchId,
        status: "RETURNED",
        date_from: "2026-09-01",
        date_to: "2026-09-30",
        sort: "oldest",
        page: "3",
        page_size: "30",
      }),
    ).toEqual({
      branchId,
      reportId,
      reportBranchId: branchId,
      status: "RETURNED",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
      sort: "oldest",
      page: 3,
      pageSize: 30,
    });
  });

  it("ignores malformed values", () => {
    expect(
      parseDailyReportPageFilters({
        branch_id: "not-a-uuid",
        report_id: "bad",
        status: "PENDING",
        date_from: "2026-02-31",
        sort: "random",
        page: ["0", "4"],
        page_size: "25",
      }),
    ).toEqual({ status: "all", sort: "newest", page: 1, pageSize: 10 });
  });

  it("opens a report without changing the list it came from", () => {
    const filters = parseDailyReportPageFilters({
      status: "SUBMITTED",
      date_from: "2026-09-01",
      page: "2",
    });
    const href = createDailyReportHref({
      ...filters,
      reportId,
      reportBranchId: branchId,
    });
    expect(href).toBe(
      `/reports?status=SUBMITTED&date_from=2026-09-01&page=2&report_id=${reportId}&report_branch=${branchId}`,
    );
    expect(
      createDailyReportHref(
        listFilters(
          parseDailyReportPageFilters(
            Object.fromEntries(new URL(href, "http://x").searchParams),
          ),
        ),
      ),
    ).toBe("/reports?status=SUBMITTED&date_from=2026-09-01&page=2");
  });
});
