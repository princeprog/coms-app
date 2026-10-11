import { hasBranchScope, hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import { cookies } from "next/headers";
import "server-only";
import { z } from "zod";
export async function menuAccess(permission: string, branch?: string) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unavailable")
    throw new ApiRequestError(
      "The service is temporarily unavailable. Try again.",
      503,
    );
  if (session.status !== "authenticated")
    throw new ApiRequestError(
      "Your session is unavailable. Sign in again.",
      401,
    );
  if (!hasPermission(session.user, permission))
    throw new ApiRequestError(
      "You do not have permission for this action.",
      403,
    );
  if (
    branch &&
    (!z.uuid().safeParse(branch).success ||
      !hasBranchScope(session.user, branch))
  )
    throw new ApiRequestError("You do not have access to this branch.", 403);
  return session.user;
}
export async function menuRequest<T extends z.ZodType>(
  endpoint: string,
  schema: T,
  method = "GET",
  body?: unknown,
  key?: string,
): Promise<z.infer<T>> {
  const data = await requestComsApi<unknown>(endpoint, {
    cookieHeader: (await cookies()).toString(),
    method,
    body,
    ...(key ? { headers: { "Idempotency-Key": key } } : {}),
  });
  const parsed = schema.safeParse(data);
  if (!parsed.success)
    throw new ApiRequestError(
      "The response could not be verified. Refresh and try again.",
      502,
    );
  return parsed.data;
}
export function menuError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission for this action or branch.";
    if (error.status === 404) return "This record is no longer available.";
    if (error.status === 409) return error.message;
    if (error.status === 400) return "Check the entered details and try again.";
  }
  return "Unable to save. Your entered details are preserved; try again.";
}
