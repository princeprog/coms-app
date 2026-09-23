import { z } from "zod";

const MAX_ROLE_ID = "9223372036854775807";

const roleIdSchema = z
  .union([
    z.string().regex(/^[1-9]\d{0,18}$/),
    z.number().int().positive().safe(),
  ])
  .transform(String)
  .refine(
    (id) =>
      id.length < MAX_ROLE_ID.length ||
      (id.length === MAX_ROLE_ID.length && id <= MAX_ROLE_ID),
  );

const branchIdsSchema = z
  .array(z.string().uuid())
  .max(100)
  .refine((ids) => new Set(ids).size === ids.length);

export const staffSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email().max(320),
    full_name: z.string().min(2).max(160),
    contact_number: z.string().min(7).max(30),
    is_active: z.boolean(),
    role_id: roleIdSchema,
    role_code: z.string().min(1),
    role_name: z.string().min(1),
    branch_ids: branchIdsSchema,
  })
  .strict();

export const staffPageSchema = z
  .object({
    items: z.array(staffSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
  })
  .strict();

export const createStaffSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(320),
    full_name: z.string().trim().min(2).max(160),
    contact_number: z.string().trim().min(7).max(30),
    password: z.string().min(12).max(128),
    role_id: roleIdSchema,
    branch_ids: branchIdsSchema,
  })
  .strict();

export const updateStaffSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(320).optional(),
    full_name: z.string().trim().min(2).max(160).optional(),
    contact_number: z.string().trim().min(7).max(30).optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0);

export const assignStaffRoleSchema = z
  .object({ role_id: roleIdSchema })
  .strict();

export const assignStaffBranchesSchema = z
  .object({ branch_ids: branchIdsSchema })
  .strict();
