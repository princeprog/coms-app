import type { z } from "zod";
import type {
  createSaleSchema,
  saleDetailSchema,
  salePageSchema,
  voidSaleSchema,
} from "@/features/sales/schemas/sale.schema";
import type { BranchProductPage } from "@/features/branch-products/types/branch-product.types";

export type SalePage = z.infer<typeof salePageSchema>;
export type Sale = z.infer<typeof saleDetailSchema>;
export type SaleListItem = SalePage["items"][number];
export type CreateSale = z.infer<typeof createSaleSchema>;
export type VoidSale = z.infer<typeof voidSaleSchema>;
export type SalesMenuPage = BranchProductPage;

export type SaleMutationResult =
  { ok: true; sale: Sale } | { ok: false; error: string };
export type SaleVoidResult = { ok: true } | { ok: false; error: string };
export type SaleCreateAction = (
  branchId: string,
  input: unknown,
  idempotencyKey: string,
) => Promise<SaleMutationResult>;
export type SaleVoidAction = (
  branchId: string,
  saleId: string,
  input: unknown,
  idempotencyKey: string,
) => Promise<SaleVoidResult>;
