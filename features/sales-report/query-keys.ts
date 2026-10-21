export const salesReportKeys = {
  all: ["sales-report"] as const,
  report: (input: object) => ["sales-report", input] as const,
};
