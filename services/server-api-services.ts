import "server-only";

import { getAccessCookieHeader } from "@/features/auth/services/session-cookie";
import { getAuthGatewayHeaders, getComsApiBaseUrl } from "@/lib/server-env";
import { requestApi, type ApiRequestOptions } from "@/services/api-services";

export type ComsServerRequestOptions = Pick<
  ApiRequestOptions,
  "method" | "body" | "headers"
> & {
  cookieHeader: string | null;
};

export function requestComsApi<T>(
  endpoint: string,
  options: ComsServerRequestOptions,
): Promise<T> {
  const headers = new Headers(options.headers);
  new Headers(getAuthGatewayHeaders()).forEach((value, key) => {
    headers.set(key, value);
  });

  return requestApi<T>(endpoint, {
    baseUrl: getComsApiBaseUrl(),
    headers,
    cookie: getAccessCookieHeader(options.cookieHeader),
    method: options.method,
    body: options.body,
    redirect: "error",
  });
}
