import { z } from "zod";

// Strip unrecognized fields at the server boundary before exposing user data to clients.
export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  full_name: z.string().min(1),
  contact_number: z.string(),
  role: z
    .object({
      id: z.string().min(1),
      code: z.string().min(1),
      name: z.string().min(1),
      isSystem: z.boolean(),
      isActive: z.boolean(),
    })
    .optional(),
  permissions: z.array(z.string()).optional(),
  branch_ids: z.array(z.string().uuid()).optional(),
});
export const authResponseSchema = z.object({ user: authUserSchema });
export const authMeResponseSchema = z
  .object({
    user: authUserSchema,
    role: authUserSchema.shape.role.unwrap(),
    permissions: z.array(z.string()),
    branch_ids: z.array(z.string().uuid()),
  })
  .transform(({ user, role, permissions, branch_ids }) => ({
    user: { ...user, role, permissions, branch_ids },
  }));

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
