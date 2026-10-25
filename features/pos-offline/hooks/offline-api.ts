import { z } from "zod";

export class OfflineRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export const offlineBranchPath = (branchId: string) =>
  `/branches/${encodeURIComponent(branchId)}`;
export async function offlineRequest<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/pos-offline${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok)
    throw new OfflineRequestError(
      data &&
        typeof data === "object" &&
        "message" in data &&
        typeof data.message === "string"
        ? data.message
        : "COMS could not complete this request. Try again.",
      response.status,
    );
  return data as T;
}
const identitySchema = z.object({ user_id: z.uuid(), enabled: z.boolean() });
export async function validateOfflineCashier() {
  return identitySchema.parse(await offlineRequest("/context"));
}
export async function validateResumingCashier() {
  const identity = await validateOfflineCashier();
  // The API flag disables new preparation only. Existing sessions must still drain.
  return { user_id: identity.user_id, enabled: true };
}
