export const dailyReportStatuses = [
  "DRAFT",
  "SUBMITTED",
  "RETURNED",
  "APPROVED",
] as const;

export const dailyReportRoute = "/reports";
export const dailyReportEndpoint = (branchId: string) =>
  `/branches/${branchId}/daily-reports`;
export const dailyReportDirectoryEndpoint = "/daily-reports";
