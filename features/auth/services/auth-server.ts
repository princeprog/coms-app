import { cookies } from "next/headers";

import { authEndpoints } from "@/features/auth/constants";
import { authMeResponseSchema } from "@/features/auth/schemas/auth.schema";
import { ApiRequestError, requestApi } from "@/services/api-services";
import { getComsApiBaseUrl, getAuthGatewayHeaders } from "@/lib/server-env";
import { recordAuthOutage } from "./auth-observability";
import type { CurrentUserResult } from "@/features/auth/types/auth.types";
import {
  getAccessCookieHeader,
  hasRefreshCookie,
} from "@/features/auth/services/session-cookie";

export async function getCurrentUserFromServer(): Promise<CurrentUserResult> {
  const cookieHeader = (await cookies()).toString();
  try {
    const payload = await requestApi<unknown>(authEndpoints.me, {
      baseUrl: getComsApiBaseUrl(),
      headers: getAuthGatewayHeaders(),
      cookie: getAccessCookieHeader(cookieHeader),
      redirect: "error",
    });
    const parsed = authMeResponseSchema.safeParse(payload);
    if (!parsed.success)
      throw new ApiRequestError("Invalid authentication response.", 502);
    return { status: "authenticated", user: parsed.data.user };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      return hasRefreshCookie(cookieHeader)
        ? { status: "recovering" }
        : { status: "unauthenticated" };
    }
    recordAuthOutage(error instanceof ApiRequestError ? error.status : 503);
    return { status: "unavailable" };
  }
}
