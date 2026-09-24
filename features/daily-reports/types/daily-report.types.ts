import type { z } from "zod";
import type {
  createDailyReportSchema,
  dailyReportDetailSchema,
  dailyReportPageSchema,
  returnDailyReportSchema,
  updateDailyReportSchema,
} from "@/features/daily-reports/schemas/daily-report.schema";

export type DailyReport = z.infer<typeof dailyReportDetailSchema>;
export type DailyReportPage = z.infer<typeof dailyReportPageSchema>;
export type DailyReportListItem = DailyReportPage["items"][number];
export type DailyReportItem = DailyReport["items"][number];
export type CreateDailyReport = z.infer<typeof createDailyReportSchema>;
export type UpdateDailyReport = z.infer<typeof updateDailyReportSchema>;
export type ReturnDailyReport = z.infer<typeof returnDailyReportSchema>;

export type DailyReportMutationResult =
  { ok: true; report: DailyReport } | { ok: false; error: string };
export type DailyReportActionResult =
  { ok: true; report: DailyReport } | { ok: false; error: string };

export type DailyReportCreateAction = (
  branchId: string,
  input: unknown,
  idempotencyKey: string,
) => Promise<DailyReportMutationResult>;
export type DailyReportUpdateAction = (
  branchId: string,
  reportId: string,
  input: unknown,
) => Promise<DailyReportMutationResult>;
export type DailyReportTransitionAction = (
  branchId: string,
  reportId: string,
) => Promise<DailyReportActionResult>;
export type DailyReportReturnAction = (
  branchId: string,
  reportId: string,
  input: unknown,
) => Promise<DailyReportActionResult>;
