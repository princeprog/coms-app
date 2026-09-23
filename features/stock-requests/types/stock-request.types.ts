import type { z } from "zod";
import type { Branch } from "@/features/branches/types/branch.types";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import type {
  createStockRequestSchema,
  stockRequestDetailSchema,
  stockRequestPageSchema,
} from "@/features/stock-requests/schemas/stock-request.schema";

export type CreateStockRequest = z.infer<typeof createStockRequestSchema>;
export type StockRequestPage = z.infer<typeof stockRequestPageSchema>;
export type StockRequest = z.infer<typeof stockRequestDetailSchema>;
export type StockRequestListItem = StockRequestPage["items"][number];
export type StockRequestFormOptions = {
  branches: Branch[];
  stockItems: StockItem[];
};
export type StockRequestStatus = StockRequest["status"];
export type StockRequestCreateAction = (
  input: unknown,
  idempotencyKey: string,
) => Promise<StockRequestMutationResult>;
export type StockRequestTransition = "approve" | "reject" | "cancel";
export type StockRequestMutationResult =
  { ok: true; request_id: string } | { ok: false; error: string };
export type StockRequestTransitionResult =
  { ok: true } | { ok: false; error: string };
export type StockRequestTransitionAction = (
  id: string,
  transition: StockRequestTransition,
) => Promise<StockRequestTransitionResult>;
