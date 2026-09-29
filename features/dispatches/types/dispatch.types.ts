import type { z } from "zod";
import type {
  createDispatchSchema,
  closeDispatchShortageSchema,
  dispatchDetailSchema,
  dispatchPageSchema,
  reportDispatchDiscrepancySchema,
  requestDispatchRecountSchema,
  receiveDispatchSchema,
} from "@/features/dispatches/schemas/dispatch.schema";
import type { Branch } from "@/features/branches/types/branch.types";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";

export type Dispatch = z.infer<typeof dispatchDetailSchema>;
export type DispatchPage = z.infer<typeof dispatchPageSchema>;
export type DispatchListItem = DispatchPage["items"][number];
export type CreateDispatchInput = z.infer<typeof createDispatchSchema>;
export type DispatchCreateOptions = { branches: Branch[]; stockItems: StockItem[] };
export type ReceiveDispatchInput = z.infer<typeof receiveDispatchSchema>;
export type CloseDispatchShortageInput = z.infer<
  typeof closeDispatchShortageSchema
>;
export type ReportDispatchDiscrepancyInput = z.infer<
  typeof reportDispatchDiscrepancySchema
>;
export type RequestDispatchRecountInput = z.infer<
  typeof requestDispatchRecountSchema
>;

export type DispatchMutationResult =
  { ok: true; dispatch_id: string } | { ok: false; error: string };
export type DispatchActionResult = { ok: true } | { ok: false; error: string };

export type DispatchCreateAction = (
  input: unknown,
  idempotencyKey: string,
) => Promise<DispatchMutationResult>;
export type DispatchPostAction = (
  id: string,
  idempotencyKey: string,
) => Promise<DispatchActionResult>;
export type DispatchReceiveAction = (
  id: string,
  input: unknown,
  idempotencyKey: string,
) => Promise<DispatchActionResult>;
export type DispatchShortageAction = (
  id: string,
  input: unknown,
  idempotencyKey: string,
) => Promise<DispatchActionResult>;
export type DispatchDiscrepancyAction = (
  id: string,
  input: unknown,
  idempotencyKey: string,
) => Promise<DispatchActionResult>;
export type DispatchRecountAction = DispatchDiscrepancyAction;
