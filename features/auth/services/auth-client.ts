import {
  currentUserAction,
  loginAction,
  logoutAction,
} from "@/features/auth/services/auth-actions";
import type {
  AuthResponse,
  LoginInput,
  User,
} from "@/features/auth/types/auth.types";
import type { AuthActionResult } from "@/features/auth/types/auth-action.types";
import { ApiRequestError } from "@/services/api-services";
import {
  announceLogout,
  supportsAuthLock,
  withAuthLock,
} from "./auth-coordination";

export { ApiRequestError };
export const AuthApiError = ApiRequestError;

function unwrap<T>(result: AuthActionResult<T>): T {
  if (!result.ok)
    throw new ApiRequestError(
      result.message,
      result.status,
      undefined,
      result.retryAfterSeconds,
    );
  return result.data;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  return withAuthLock(async () => unwrap(await loginAction(input)));
}

let sessionCheck: Promise<User | null> | undefined;
export function getCurrentUser(): Promise<User | null> {
  if (!sessionCheck) {
    sessionCheck = withAuthLock(async () =>
      unwrap(await currentUserAction(supportsAuthLock())),
    ).finally(() => {
      sessionCheck = undefined;
    });
  }
  return sessionCheck;
}

export async function refreshSession(): Promise<AuthResponse> {
  const user = await getCurrentUser();
  if (!user) throw new ApiRequestError("Sign in again.", 401);
  return { user };
}

export async function logout(): Promise<void> {
  await withAuthLock(async () => {
    unwrap(await logoutAction());
    announceLogout();
  });
}

export function displayName(user: Pick<User, "full_name">) {
  return user.full_name;
}
