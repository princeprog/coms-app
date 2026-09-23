import "server-only";

import { getAccessCookieHeader } from "@/features/auth/services/session-cookie";
import { getAuthGatewayHeaders, getComsApiBaseUrl } from "@/lib/server-env";
import { requestApi, type ApiRequestOptions } from "@/services/api-services";

export type ComsServerRequestOptions = Pick<
  ApiRequestOptions,
  "method" | "body"
> & {
  cookieHeader: string | null;
};

export function requestComsApi<T>(
  endpoint: string,
  options: ComsServerRequestOptions,
): Promise<T> {
  return requestApi<T>(endpoint, {
    baseUrl: getComsApiBaseUrl(),
    headers: getAuthGatewayHeaders(),
    cookie: getAccessCookieHeader(options.cookieHeader),
    method: options.method,
    body: options.body,
    redirect: "error",
  });
}
