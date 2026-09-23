export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  baseUrl?: string;
  body?: unknown;
  headers?: HeadersInit;
  cookie?: string;
  throwOnError?: boolean;
};

function getMessage(payload: unknown): string {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = payload.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  }
  return "API request failed.";
}

export async function requestApiRaw(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const {
    baseUrl = "/api",
    body,
    headers: inputHeaders,
    cookie,
    throwOnError = true,
    ...init
  } = options;
  const headers = new Headers(inputHeaders);
  const hasBody = body !== undefined;
  if (hasBody && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (cookie) headers.set("cookie", cookie);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      ...init,
      headers,
      body: hasBody
        ? typeof body === "string"
          ? body
          : JSON.stringify(body)
        : undefined,
      cache: "no-store",
      redirect: init.redirect ?? "error",
      credentials: init.credentials ?? "include",
      signal: init.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(10_000)])
        : AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ApiRequestError("API service unavailable.", 503);
  }

  if (!response.ok && throwOnError) {
    let payload: unknown;
    try {
      payload = await response.clone().json();
    } catch {
      payload = undefined;
    }
    throw new ApiRequestError(
      getMessage(payload),
      response.status,
      payload,
      getRetryAfter(response),
    );
  }

  return response;
}

export function getRetryAfter(response: Response): number | undefined {
  const value = response.headers.get("retry-after");
  if (!value) return undefined;
  const seconds = /^\d+$/.test(value)
    ? Number(value)
    : Math.ceil((Date.parse(value) - Date.now()) / 1000);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

export async function requestApi<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await requestApiRaw(endpoint, options);
  if ([204, 205, 304].includes(response.status)) {
    return undefined as T;
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiRequestError("API returned an invalid response.", 502);
  }
}
