import { expect, it } from "vitest";
import { salesHistoryDates, formatSaleTime } from "./sales-history-filters";
import { createSalesHref, parseSalesPageFilters } from "./sales-page-params";
it("defaults to the Manila date on either side of UTC midnight", () => {
  const filters = { page: 1, historyPage: 1, search: "" };
  expect(salesHistoryDates(filters, new Date("2026-10-19T16:00:00Z"))).toEqual({
    dateFrom: "2026-10-20",
    dateTo: "2026-10-20",
  });
  expect(salesHistoryDates(filters, new Date("2026-10-19T15:59:59Z"))).toEqual({
    dateFrom: "2026-10-19",
    dateTo: "2026-10-19",
  });
  expect(salesHistoryDates({ ...filters, historyPeriod: "all" })).toEqual({});
  expect(formatSaleTime("2026-10-19T16:00:00Z")).toContain("12:00");
});
it("round trips history independently of checkout and rejects invalid ranges and page sizes", () => {
  const filters = parseSalesPageFilters({
    page: "3",
    search: "chicken",
    history_search: "  S-000123 ",
    history_page_size: "30",
    history_status: "VOIDED",
    history_tender: "Old cash method",
    history_period: "custom",
    history_from: "2026-10-01",
    history_to: "2026-10-20",
  });
  const params = Object.fromEntries(
    new URL(createSalesHref(filters), "http://localhost").searchParams,
  );
  expect(parseSalesPageFilters(params)).toEqual(filters);
  expect(salesHistoryDates(filters)).toEqual({
    dateFrom: "2026-10-01",
    dateTo: "2026-10-20",
  });
  expect(
    parseSalesPageFilters({
      history_page_size: "500",
      history_period: "custom",
      history_from: "2026-02-30",
      history_to: "2026-02-01",
    }),
  ).not.toHaveProperty("historyPeriod");
  expect(
    parseSalesPageFilters({ history_page_size: "500" }),
  ).not.toHaveProperty("historyPageSize");
});
