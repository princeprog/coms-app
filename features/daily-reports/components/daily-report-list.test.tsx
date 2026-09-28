// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
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
      completed_sales_amount: "0",
      completed_sales_count: 0,
      voided_sales_amount: "0",
      voided_sales_count: 0,
      created_at: "2026-09-24T02:00:00.000Z",
      updated_at: "2026-09-24T02:00:00.000Z",
    },
  ],
  total: 30,
  page: 1,
  page_size: 25,
};

describe("daily report list", () => {
  it("renders a compact table and preserves branch and status in client links", () => {
    render(
      <DailyReportList
        page={page}
        filters={{ branchId, status: "SUBMITTED", page: 1 }}
      />,
    );

    const reportRow = screen.getByRole("row", { name: /2026-09-23/i });
    expect(
      within(reportRow)
        .getByRole("link", { name: /open report/i })
        .getAttribute("href"),
    ).toBe(
      `/reports?branch_id=${branchId}&status=SUBMITTED&report_id=${reportId}`,
    );
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe(`/reports?branch_id=${branchId}&status=SUBMITTED&page=2`);
    expect(
      screen.getByRole("region", { name: /daily report results/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("columnheader", { name: "Business date" }),
    ).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Updated" })).toBeTruthy();
  });

  it("shows the visible result range and disables unavailable pagination", () => {
    render(
      <DailyReportList
        page={{ ...page, total: 1, page_size: 25 }}
        filters={{ branchId, status: "all", page: 1 }}
      />,
    );

    expect(screen.getByText("Showing 1–1 of 1 reports")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Previous page" })).toBeNull();
  });

  it("explains when the branch has no reports for the selected status", () => {
    render(
      <DailyReportList
        page={{ ...page, items: [], total: 0 }}
        filters={{ branchId, status: "RETURNED", page: 1 }}
      />,
    );

    expect(screen.getByText("No returned reports")).toBeTruthy();
    expect(screen.getByText(/choose another status/i)).toBeTruthy();
  });
});
