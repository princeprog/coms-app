import type { z } from "zod";
import type {
  createProductSchema,
  productPageSchema,
  productSchema,
} from "@/features/products/schemas/product.schema";

export type Product = z.infer<typeof productSchema>;
export type ProductPage = z.infer<typeof productPageSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
