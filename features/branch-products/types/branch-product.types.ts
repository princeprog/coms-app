import type { z } from "zod";
import type {
  branchProductAvailabilitySchema,
  branchProductCreateSchema,
  branchProductPageSchema,
  branchProductSchema,
} from "@/features/branch-products/schemas/branch-product.schema";

export type BranchProduct = z.infer<typeof branchProductSchema>;
export type BranchProductPage = z.infer<typeof branchProductPageSchema>;
export type BranchProductCreateInput = z.infer<
  typeof branchProductCreateSchema
>;
export type BranchProductAvailabilityInput = z.infer<
  typeof branchProductAvailabilitySchema
>;
export type BranchProductBranchOption = {
  id: string;
  name: string;
  serviceTypes?: ("DINE_IN" | "TAKEAWAY")[];
  status: "active" | "inactive" | "unknown";
};
export type BranchProductProductOption = {
  id: string;
  product_name: string;
};
export type BranchProductMutationResult =
  { ok: true } | { ok: false; error: string };
export type BranchProductOperationAction = (
  branchId: string,
  productId: string,
  input: unknown,
) => Promise<BranchProductMutationResult>;
