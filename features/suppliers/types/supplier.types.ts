import type { z } from "zod";
import type {
  createSupplierSchema,
  supplierPageSchema,
  supplierSchema,
} from "@/features/suppliers/schemas/supplier.schema";

export type Supplier = z.infer<typeof supplierSchema>;
export type SupplierPage = z.infer<typeof supplierPageSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
