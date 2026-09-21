import { cookies } from "next/headers";

import { authEndpoints } from "@/features/auth/constants";
import { ApiRequestError, requestApi } from "@/services/api-services";
import { getComsApiBaseUrl } from "@/lib/server-env";
import type {
  AuthResponse,
  CurrentUserResult,
} from "@/features/auth/types/auth.types";
import {
  getAccessCookieHeader,
  hasRefreshCookie,
} from "@/features/auth/services/session-cookie";

export async function getCurrentUserFromServer(): Promise<CurrentUserResult> {
  const cookieHeader = (await cookies()).toString();
  try {
    const payload = await requestApi<AuthResponse>(authEndpoints.me, {
      baseUrl: getComsApiBaseUrl(),
      cookie: getAccessCookieHeader(cookieHeader),
    });
    return { status: "authenticated", user: payload.user };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      return hasRefreshCookie(cookieHeader)
        ? { status: "recovering" }
        : { status: "unauthenticated" };
    }
    return { status: "unavailable" };
  }
}
