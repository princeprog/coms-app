import type { SalesPageFilters } from "./sales-page-params";

export function salesHistoryDates(filters: SalesPageFilters, now = new Date()) {
  if (filters.historyPeriod === "all") return {};
  if (
    filters.historyPeriod === "custom" &&
    filters.historyFrom &&
    filters.historyTo
  )
    return { dateFrom: filters.historyFrom, dateTo: filters.historyTo };
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return { dateFrom: today, dateTo: today };
}

export function formatSaleTime(value: string, date = false) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    ...(date
      ? ({ month: "short", day: "numeric", year: "numeric" } as const)
      : ({ hour: "numeric", minute: "2-digit" } as const)),
  }).format(new Date(value));
}
