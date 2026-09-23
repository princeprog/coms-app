import { z } from "zod";

const positiveDecimalString = z
  .string()
  .max(80)
  .regex(/^\d+(?:\.\d+)?$/)
  .refine((value) => /[1-9]/.test(value));

export const recipeProductSchema = z.object({
  id: z.uuid(),
  product_name: z.string().min(2).max(160),
  description: z.string().nullable(),
  is_active: z.boolean(),
});

export const recipeIngredientSchema = z.object({
  product_id: z.uuid(),
  stock_item_id: z.uuid(),
  stock_item_name: z.string().min(2).max(160),
  unit: z.string().min(1).max(40),
  stock_item_is_active: z.boolean(),
  quantity_required: positiveDecimalString,
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export const recipeResponseSchema = z.object({
  product: recipeProductSchema,
  items: z.array(recipeIngredientSchema).max(100),
});

export const recipeInputSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            stock_item_id: z.uuid(),
            quantity_required: positiveDecimalString,
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .refine(
    ({ items }) =>
      new Set(items.map((item) => item.stock_item_id)).size === items.length,
    { message: "Choose each stock item only once.", path: ["items"] },
  );
