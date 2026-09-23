import { z } from "zod";
import { catalogPageSchema } from "@/features/catalogs/schemas/catalog.schema";

function nullableText(maxLength: number) {
  return z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const normalized = value.trim();
    return normalized || null;
  }, z.string().max(maxLength).nullable().optional());
}

const nullableEmail = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}, z.email().max(254).nullable().optional());

export const supplierSchema = z.object({
  id: z.uuid(),
  supplier_name: z.string().min(2).max(160),
  contact_person: z.string().nullable(),
  contact_number: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export const supplierPageSchema = catalogPageSchema(supplierSchema);

export const createSupplierSchema = z
  .object({
    supplier_name: z.string().trim().min(2).max(160),
    contact_person: nullableText(120),
    contact_number: nullableText(32),
    email: nullableEmail,
    address: nullableText(1000),
  })
  .strict();

export const updateSupplierSchema = z
  .object({
    supplier_name: z.string().trim().min(2).max(160).optional(),
    contact_person: nullableText(120),
    contact_number: nullableText(32),
    email: nullableEmail,
    address: nullableText(1000),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one supplier field to update.",
  });
