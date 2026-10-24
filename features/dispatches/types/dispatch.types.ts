import type { z } from "zod";
import type {
  createDispatchSchema,
  closeDispatchShortageSchema,
  dispatchDetailSchema,
  dispatchPageSchema,
  receiveDispatchSchema,
  sendDispatchSchema,
} from "@/features/dispatches/schemas/dispatch.schema";
import type { dispatchResolutionOutcomes } from "@/features/dispatches/constants";
import type { Branch } from "@/features/branches/types/branch.types";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";

export type Dispatch = z.infer<typeof dispatchDetailSchema>;
export type DispatchItem = Dispatch["items"][number];
export type DispatchPage = z.infer<typeof dispatchPageSchema>;
export type DispatchListItem = DispatchPage["items"][number];
export type CreateDispatchInput = z.infer<typeof createDispatchSchema>;
export type SendDispatchInput = z.infer<typeof sendDispatchSchema>;
export type DispatchResolutionOutcome =
  (typeof dispatchResolutionOutcomes)[number];
export type DispatchStockOption = Pick<
  StockItem,
  "id" | "stock_item_name" | "unit"
> & { quantity_on_hand?: string | null; is_active?: boolean };
export type DispatchStockPage = {
  items: DispatchStockOption[];
  total: number;
  page: number;
  page_size: number;
  availabilityVisible: boolean;
};
export type DispatchCreateOptions = {
  branches: Branch[];
  stockItems: DispatchStockOption[];
  availabilityVisible?: boolean;
};
export type ReceiveDispatchInput = z.infer<typeof receiveDispatchSchema>;
export type CloseDispatchShortageInput = z.infer<
  typeof closeDispatchShortageSchema
>;

export type DispatchMutationResult =
  { ok: true; dispatch_id: string } | { ok: false; error: string };
/** A counted item that came out above or below what the commissary sent. */
export type DispatchCountDifference = {
  stock_item_name: string;
  unit: string;
  /** Counted minus sent; positive is over, negative is short. */
  quantity_variance: string;
};

export type DispatchActionResult =
  | {
      ok: true;
      receiving_outcome?: "POSTED" | "REVIEW_REQUIRED";
      /** Present once a count is posted; empty when every item matched. */
      differences?: DispatchCountDifference[];
    }
  | { ok: false; error: string };

export type DispatchCreateAction = (
  input: unknown,
  idempotencyKey: string,
) => Promise<DispatchMutationResult>;
export type DispatchPostAction = (
  id: string,
  input: unknown,
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
