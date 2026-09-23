import type { z } from "zod";
import type {
  authUserSchema,
  authResponseSchema,
  authMeResponseSchema,
} from "@/features/auth/schemas/auth.schema";

export type User = z.infer<typeof authUserSchema>;

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponse = z.infer<typeof authResponseSchema>;
export type AuthMeResponse = z.infer<typeof authMeResponseSchema>;

export type CurrentUserResult =
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated" }
  | { status: "recovering" }
  | { status: "unavailable" };
