import type { z } from "zod";
import type {
  closeDispatchShortageSchema,
  dispatchDetailSchema,
  dispatchPageSchema,
  receiveDispatchSchema,
} from "@/features/dispatches/schemas/dispatch.schema";

export type Dispatch = z.infer<typeof dispatchDetailSchema>;
export type DispatchPage = z.infer<typeof dispatchPageSchema>;
export type DispatchListItem = DispatchPage["items"][number];
export type ReceiveDispatchInput = z.infer<typeof receiveDispatchSchema>;
export type CloseDispatchShortageInput = z.infer<
  typeof closeDispatchShortageSchema
>;

export type DispatchMutationResult =
  { ok: true; dispatch_id: string } | { ok: false; error: string };
export type DispatchActionResult = { ok: true } | { ok: false; error: string };

export type DispatchCreateAction = (
  stockRequestId: string,
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
