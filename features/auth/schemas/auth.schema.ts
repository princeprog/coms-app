import { z } from "zod";

// Strip unrecognized fields at the server boundary before exposing user data to clients.
export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  full_name: z.string().min(1),
  contact_number: z.string(),
});
export const authResponseSchema = z.object({ user: authUserSchema });

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
