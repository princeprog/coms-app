"use server";

import { cookies, headers } from "next/headers";

import { authEndpoints } from "@/features/auth/constants";
import {
  authMeResponseSchema,
  authResponseSchema,
} from "@/features/auth/schemas/auth.schema";
import { getComsApiBaseUrl, getAuthGatewayHeaders } from "@/lib/server-env";
import { expireAuthCookies } from "./auth-cookie-expiration";
import { getRetryAfter } from "@/services/api-services";
import { recordAuthOutage } from "./auth-observability";
import { ApiRequestError, requestApiRaw } from "@/services/api-services";
import type {
  AuthResponse,
  AuthMeResponse,
  LoginInput,
  User,
} from "@/features/auth/types/auth.types";
import type { AuthActionResult } from "@/features/auth/types/auth-action.types";

const ACCESS_COOKIE_NAMES = new Set(["coms_access", "__Host-coms_access"]);
const REFRESH_COOKIE_NAMES = new Set(["coms_refresh", "__Host-coms_refresh"]);
const AUTH_COOKIE_NAMES = new Set([
  ...ACCESS_COOKIE_NAMES,
  ...REFRESH_COOKIE_NAMES,
]);

type InternalResult<T> =
  | { ok: true; data: T; response: Response }
  | { ok: false; status: number; message: string; retryAfterSeconds?: number };

function errorMessage(payload: unknown) {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = payload.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  }
  return "Authentication request failed.";
}

function responseCookies(response: Response) {
  const getSetCookie = (
    response.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;
  return getSetCookie
    ? getSetCookie.call(response.headers)
    : response.headers.get("set-cookie")
      ? [response.headers.get("set-cookie") as string]
      : [];
}

async function selectedCookieHeader(names: Set<string>) {
  const store = await cookies();
  const selected = store
    .getAll()
    .filter(({ name }) => names.has(name))
    .map(({ name, value }) => `${name}=${value}`);
  return selected.length > 0 ? selected.join("; ") : undefined;
}

async function relayResponseCookies(response: Response) {
  const store = await cookies();
  for (const rawCookie of responseCookies(response)) {
    const [pair, ...rawAttributes] = rawCookie.split(";");
    const separator = pair.indexOf("=");
    if (separator < 1) continue;

    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (!AUTH_COOKIE_NAMES.has(name)) continue;

    const options: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "lax" | "strict" | "none";
      path?: string;
      maxAge?: number;
      expires?: Date;
    } = {};

    for (const rawAttribute of rawAttributes) {
      const attribute = rawAttribute.trim();
      const [rawKey, ...rawValue] = attribute.split("=");
      const key = rawKey.toLowerCase();
      const attributeValue = rawValue.join("=");
      if (key === "httponly") options.httpOnly = true;
      if (key === "secure") options.secure = true;
      if (key === "path" && attributeValue) options.path = attributeValue;
      if (key === "samesite") {
        const sameSite = attributeValue.toLowerCase();
        if (
          sameSite === "lax" ||
          sameSite === "strict" ||
          sameSite === "none"
        ) {
          options.sameSite = sameSite;
        }
      }
      if (key === "max-age") {
        const maxAge = Number(attributeValue);
        if (Number.isFinite(maxAge)) options.maxAge = maxAge;
      }
      if (key === "expires") {
        const expires = new Date(attributeValue);
        if (!Number.isNaN(expires.getTime())) options.expires = expires;
      }
    }

    await store.set(name, value, options);
  }
}

async function callAuthEndpoint<T>(
  endpoint: string,
  options: {
    method: "GET" | "POST";
    body?: unknown;
    cookie?: string;
  },
): Promise<InternalResult<T>> {
  try {
    const origin = (await headers()).get("origin");
    const response = await requestApiRaw(endpoint, {
      baseUrl: getComsApiBaseUrl(),
      method: options.method,
      headers: { ...getAuthGatewayHeaders(), ...(origin ? { origin } : {}) },
      body: options.body,
      cookie: options.cookie,
      throwOnError: false,
      redirect: "error",
    });

    let payload: unknown;
    if (![204, 205, 304].includes(response.status)) {
      try {
        payload = await response.clone().json();
      } catch {
        payload = undefined;
      }
    }

    if (!response.ok) {
      recordAuthOutage(response.status);
      return {
        ok: false,
        status: response.status,
        message: errorMessage(payload),
        ...(getRetryAfter(response) !== undefined
          ? { retryAfterSeconds: getRetryAfter(response) }
          : {}),
      };
    }

    const isLogout = endpoint === authEndpoints.logout;
    const parsed = isLogout
      ? undefined
      : endpoint === authEndpoints.me
        ? authMeResponseSchema.safeParse(payload)
        : authResponseSchema.safeParse(payload);
    if (
      response.status !== (isLogout ? 204 : 200) ||
      (!isLogout && !parsed?.success)
    ) {
      throw new ApiRequestError(
        "Authentication service returned an invalid response.",
        502,
      );
    }
    return {
      ok: true,
      data: (parsed?.success ? parsed.data : undefined) as T,
      response,
    };
  } catch (error) {
    recordAuthOutage(error instanceof ApiRequestError ? error.status : 503);
    if (error instanceof ApiRequestError) {
      return { ok: false, status: error.status, message: error.message };
    }
    return {
      ok: false,
      status: 503,
      message: "Authentication service unavailable.",
    };
  }
}

async function refreshWithCookies(): Promise<AuthActionResult<AuthResponse>> {
  const result = await callAuthEndpoint<AuthResponse>(authEndpoints.refresh, {
    method: "POST",
    cookie: await selectedCookieHeader(REFRESH_COOKIE_NAMES),
  });
  if (!result.ok) {
    if (result.status === 401) await expireAuthCookies();
    return result;
  }
  await relayResponseCookies(result.response);
  return { ok: true, data: result.data };
}

export async function loginAction(
  input: LoginInput,
): Promise<AuthActionResult<AuthResponse>> {
  const result = await callAuthEndpoint<AuthResponse>(authEndpoints.login, {
    method: "POST",
    body: input,
  });
  if (!result.ok) return result;
  await relayResponseCookies(result.response);
  return { ok: true, data: result.data };
}

export async function logoutAction(): Promise<AuthActionResult<void>> {
  const result = await callAuthEndpoint<void>(authEndpoints.logout, {
    method: "POST",
    cookie: await selectedCookieHeader(AUTH_COOKIE_NAMES),
  });
  if (!result.ok) return result;
  await expireAuthCookies();
  return { ok: true, data: undefined };
}

export async function currentUserAction(
  allowRefresh = true,
): Promise<AuthActionResult<User | null>> {
  const current = await callAuthEndpoint<AuthMeResponse>(authEndpoints.me, {
    method: "GET",
    cookie: await selectedCookieHeader(ACCESS_COOKIE_NAMES),
  });

  if (current.ok) return { ok: true, data: current.data.user };
  if (current.status !== 401) return current;

  const refreshCookie = await selectedCookieHeader(REFRESH_COOKIE_NAMES);
  if (!refreshCookie) {
    await expireAuthCookies();
    return { ok: true, data: null };
  }
  if (!allowRefresh)
    return {
      ok: false,
      status: 428,
      message: "This browser cannot safely restore the session. Sign in again.",
    };

  const refreshed = await refreshWithCookies();
  if (!refreshed.ok) {
    if (refreshed.status === 401) return { ok: true, data: null };
    return refreshed;
  }

  const retried = await callAuthEndpoint<AuthMeResponse>(authEndpoints.me, {
    method: "GET",
    cookie: await selectedCookieHeader(ACCESS_COOKIE_NAMES),
  });
  if (retried.ok) return { ok: true, data: retried.data.user };
  if (retried.status === 401) {
    await expireAuthCookies();
    return { ok: true, data: null };
  }
  return retried;
}
