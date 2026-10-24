"use server";
import { cookies } from "next/headers";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requestComsApi } from "@/services/server-api-services";
import { ApiRequestError } from "@/services/api-services";
import { dispatchesEndpoint } from "../constants";
import { dispatchDetailSchema } from "../schemas/dispatch.schema";
import type { CountReminderResult } from "../types/count-reminder.types";

export async function sendCountReminderAction(
  id: string,
  key: string,
): Promise<CountReminderResult> {
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(key).success)
    return { ok: false, status: 400, error: "Check the selected dispatch." };
  try {
    const data = dispatchDetailSchema.parse(
      await requestComsApi(`${dispatchesEndpoint}/${id}/count-reminders`, {
        cookieHeader: (await cookies()).toString(),
        method: "POST",
        headers: { "Idempotency-Key": key },
      }),
    );
    if (!data.count_reminder?.last_sent_at)
      throw new ApiRequestError(
        "The reminder could not be confirmed. Try again to check the same request.",
        502,
      );
    revalidatePath("/dispatches");
    revalidatePath(`/dispatches/${id}`);
    return { ok: true, data: data.count_reminder };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const retry = z
        .object({ next_allowed_at: z.iso.datetime() })
        .safeParse(error.payload);
      return {
        ok: false,
        status: error.status,
        error:
          error.status === 403
            ? "You do not have permission to remind this branch."
            : error.message,
        ...(retry.success
          ? { next_allowed_at: retry.data.next_allowed_at }
          : {}),
      };
    }
    return {
      ok: false,
      status: 503,
      error: "COMS could not confirm the reminder. Try again.",
    };
  }
}
