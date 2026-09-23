import type { z } from "zod";
import type {
  createSupplierReceiptSchema,
  supplierReceiptDetailSchema,
  supplierReceiptPageSchema,
} from "@/features/supplier-receipts/schemas/supplier-receipt.schema";

export type CreateSupplierReceipt = z.infer<typeof createSupplierReceiptSchema>;
export type SupplierReceiptPage = z.infer<typeof supplierReceiptPageSchema>;
export type SupplierReceipt = z.infer<typeof supplierReceiptDetailSchema>;
export type SupplierReceiptListItem = SupplierReceiptPage["items"][number];

export type SupplierReceiptMutationResult =
  { ok: true; receipt_id: string } | { ok: false; error: string };

export type SupplierReceiptPostResult =
  { ok: true } | { ok: false; error: string };
