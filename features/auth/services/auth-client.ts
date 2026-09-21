import {
  currentUserAction,
  loginAction,
  logoutAction,
  refreshSessionAction,
} from "@/features/auth/services/auth-actions";
import type {
  AuthResponse,
  LoginInput,
  User,
} from "@/features/auth/types/auth.types";
import { ApiRequestError } from "@/services/api-services";

export { ApiRequestError };
export const AuthApiError = ApiRequestError;

function unwrap<T>(
  result:
    | {
        ok: true;
        data: T;
      }
    | {
        ok: false;
        status: number;
        message: string;
      },
): T {
  if (!result.ok) {
    throw new ApiRequestError(result.message, result.status);
  }
  return result.data;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  return unwrap(await loginAction(input));
}

export async function refreshSession(): Promise<AuthResponse> {
  return unwrap(await refreshSessionAction());
}

export async function getCurrentUser(): Promise<User | null> {
  return unwrap(await currentUserAction());
}

export async function logout(): Promise<void> {
  return unwrap(await logoutAction());
}

export function displayName(user: Pick<User, "full_name">) {
  return user.full_name;
}
