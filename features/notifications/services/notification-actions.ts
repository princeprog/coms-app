"use server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { requestComsApi } from "@/services/server-api-services";
import { ApiRequestError } from "@/services/api-services";
import { notificationsEndpoint } from "../constants";
import {
  notificationFiltersSchema,
  notificationPageSchema,
  type NotificationResult,
} from "../schemas/notification.schema";

async function requestNotification<T>(
  userId: string,
  path: string,
  schema: z.ZodType<T>,
  method: "GET" | "PATCH" = "GET",
): Promise<NotificationResult<T>> {
  try {
    const session = await getCurrentUserFromServer();
    if (session.status !== "authenticated" || session.user.id !== userId)
      return {
        ok: false,
        error: "Your session changed. Refresh to continue.",
        status: session.status === "unavailable" ? 503 : 401,
      };
    const data = schema.parse(
      await requestComsApi<unknown>(path, {
        method,
        cookieHeader: (await cookies()).toString(),
      }),
    );
    return { ok: true, data };
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 503;
    return {
      ok: false,
      status,
      error:
        status === 403
          ? "Notifications are unavailable for your current access."
          : status === 404
            ? "This notification is no longer available."
            : "Unable to update notifications. Please try again.",
    };
  }
}
export async function getNotificationsAction(userId: string, input: unknown) {
  const parsed = notificationFiltersSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false as const,
      status: 400,
      error: "Check the notification filters.",
    };
  const query = new URLSearchParams(
    Object.entries(parsed.data).map(([key, value]) => [key, String(value)]),
  );
  return requestNotification(
    userId,
    `${notificationsEndpoint}?${query}`,
    notificationPageSchema,
  );
}
export async function getNotificationCountAction(userId: string) {
  return requestNotification(
    userId,
    `${notificationsEndpoint}/unread-count`,
    z.object({
      unread_count: z.number().int().nonnegative(),
      latest_unread_at: z.iso.datetime().nullable().optional(),
    }),
  );
}
export async function markNotificationReadAction(userId: string, id?: string) {
  if (id !== undefined && !z.uuid().safeParse(id).success)
    return {
      ok: false as const,
      status: 400,
      error: "Select a valid notification.",
    };
  const path = id
    ? `${notificationsEndpoint}/${id}/read`
    : `${notificationsEndpoint}/read-all`;
  return requestNotification(
    userId,
    path,
    z.union([
      z.object({ updated: z.literal(true) }),
      z.object({ id: z.uuid(), read_at: z.string() }),
    ]),
    "PATCH",
  );
}
