import { z } from "zod";

export const branchSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  branch_name: z.string().min(1),
  address: z.string().nullable(),
  date_opened: z.string().nullable(),
  has_dine_in: z.boolean(),
  status: z.enum(["active", "inactive"]),
});

export const branchesResponseSchema = z.object({
  items: z.array(branchSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

const branchDateSchema = z.union([z.iso.date(), z.iso.datetime()]).nullable();

export const createBranchSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^[A-Z0-9][A-Z0-9_-]{1,49}$/),
    branch_name: z.string().trim().min(2).max(160),
    address: z.string().trim().max(1000).nullable(),
    date_opened: branchDateSchema,
    has_dine_in: z.boolean(),
  })
  .strict();

export const updateBranchSchema = z
  .object({
    branch_name: z.string().trim().min(2).max(160),
    address: z.string().trim().max(1000).nullable(),
    date_opened: branchDateSchema,
    has_dine_in: z.boolean(),
  })
  .strict();
