// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DailyReportPage } from "@/features/daily-reports/types/daily-report.types";
import { DailyReportList } from "./daily-report-list";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const reportId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const page: DailyReportPage = {
  items: [
    {
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
    },
  ],
  total: 30,
  page: 1,
  page_size: 25,
};

describe("daily report list", () => {
  it("links to selected reports and retains branch and status while paginating", () => {
    render(
      <DailyReportList
        page={page}
        filters={{ branchId, status: "SUBMITTED", page: 1 }}
      />,
    );

    expect(
      screen
        .getByRole("link", { name: /2026-09-23.*open report/i })
        .getAttribute("href"),
    ).toBe(
      `/reports?branch_id=${branchId}&status=SUBMITTED&report_id=${reportId}`,
    );
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe(`/reports?branch_id=${branchId}&status=SUBMITTED&page=2`);
    expect(screen.getByLabelText("Status")).toBeTruthy();
  });

  it("explains when the branch has no reports for the selected status", () => {
    render(
      <DailyReportList
        page={{ ...page, items: [], total: 0 }}
        filters={{ branchId, status: "RETURNED", page: 1 }}
      />,
    );

    expect(screen.getByText("No returned reports.")).toBeTruthy();
    expect(screen.getByText(/choose another status/i)).toBeTruthy();
  });
});
