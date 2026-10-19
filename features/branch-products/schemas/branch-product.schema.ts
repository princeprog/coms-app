import { z } from "zod";
import {
  serviceTypesSchema,
  serviceTypeSchema,
} from "@/features/menus/schemas/menu.schema";

const nonnegativeDecimalString = z
  .string()
  .max(80)
  .regex(/^\d+(?:\.\d+)?$/);

export const branchProductSchema = z.object({
  branch_id: z.uuid(),
  branch_name: z.string().min(2).max(160).optional(),
  product_id: z.uuid(),
  product_name: z.string().min(2).max(160),
  description: z.string().nullable(),
  product_is_active: z.boolean(),
  category_id: z.uuid(),
  category_name: z.string(),
  category_is_active: z.boolean(),
  price: nonnegativeDecimalString,
  price_revision: z.number().int().nonnegative().optional(),
  service_types: z.array(serviceTypeSchema).optional(),
  available_service_types: z.array(serviceTypeSchema).optional(),
  eligible_service_types: z.array(serviceTypeSchema).optional(),
  blocked_reason: z.string().nullable().optional(),
  has_dine_in: z.boolean().optional(),
  has_takeaway: z.boolean().optional(),
  is_available: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export const branchProductPageSchema = z.object({
  items: z.array(branchProductSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

export const branchProductCreateSchema = z
  .object({
    product_id: z.uuid(),
    service_types: serviceTypesSchema,
  })
  .strict();

export const branchProductAvailabilitySchema = z
  .object({ is_available: z.boolean() })
  .strict();
export const branchProductServicesSchema = z
  .object({ service_types: serviceTypesSchema })
  .strict();

export const branchMenuCategoriesSchema = z.array(
  z.object({ id: z.uuid(), name: z.string().min(2).max(80) }),
);
export type BranchMenuCategory = z.infer<
  typeof branchMenuCategoriesSchema
>[number];
