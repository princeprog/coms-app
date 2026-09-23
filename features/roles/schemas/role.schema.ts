import { z } from "zod";

const roleIdSchema = z
  .union([
    z.string().regex(/^[1-9]\d{0,18}$/),
    z.number().int().positive().safe(),
  ])
  .transform(String);

export const roleSchema = z.object({
  id: roleIdSchema,
  code: z.string().min(1),
  role_name: z.string().min(1),
  is_system: z.boolean(),
  is_active: z.boolean(),
  permission_keys: z.array(z.string()),
});

export const permissionSchema = z.object({
  key: z.string().min(1),
  module_key: z.string().min(1),
  action_key: z.string().min(1),
  description: z.string().min(1),
});

export const rolesResponseSchema = z.array(roleSchema);
export const permissionsResponseSchema = z.array(permissionSchema);

export const createRoleSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^[A-Z0-9][A-Z0-9_-]{1,49}$/),
    role_name: z.string().trim().min(2).max(160),
    permission_keys: z.array(z.string().min(1)).max(200),
  })
  .strict();

export const updateRoleNameSchema = z
  .object({
    role_name: z.string().trim().min(2).max(160),
  })
  .strict();

export const replaceRolePermissionsSchema = z
  .object({
    permission_keys: z.array(z.string().min(1)).max(200),
  })
  .strict();
