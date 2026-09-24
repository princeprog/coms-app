import { describe, expect, it } from "vitest";

async function getPageParams() {
  return import("./daily-report-page-params").catch(() => null);
}

describe("daily report page parameters", () => {
  it("normalizes branch, report, status, and pagination filters", async () => {
    const pageParams = await getPageParams();
    expect(pageParams).not.toBeNull();
    if (!pageParams) return;

    const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
    const reportId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
    expect(
      pageParams.parseDailyReportPageFilters({
        branch_id: branchId.toUpperCase(),
        report_id: reportId,
        status: "RETURNED",
        page: "3",
      }),
    ).toEqual({
      branchId,
      reportId,
      status: "RETURNED",
      page: 3,
    });
  });

  it("ignores malformed IDs and unsupported filters", async () => {
    const pageParams = await getPageParams();
    expect(pageParams).not.toBeNull();
    if (!pageParams) return;

    expect(
      pageParams.parseDailyReportPageFilters({
        branch_id: "not-a-uuid",
        report_id: "bad",
        status: "PENDING",
        page: ["0", "4"],
      }),
    ).toEqual({ status: "all", page: 1 });
  });

  it("builds detail and pagination links without dropping the current filters", async () => {
    const pageParams = await getPageParams();
    expect(pageParams).not.toBeNull();
    if (!pageParams) return;

    expect(
      pageParams.createDailyReportHref({
        branchId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        reportId: "3fa85f64-5717-4562-b3fc-2c963f66afa7",
        status: "SUBMITTED",
        page: 2,
      }),
    ).toBe(
      "/reports?branch_id=3fa85f64-5717-4562-b3fc-2c963f66afa6&status=SUBMITTED&page=2&report_id=3fa85f64-5717-4562-b3fc-2c963f66afa7",
    );
  });
});
