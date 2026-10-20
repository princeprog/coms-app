"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { isProtectedSuperAdmin } from "@/features/auth/permissions";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import { businessDayEndpoint, businessDayRoute } from "../constants";
import {
  businessDaySchema,
  scheduleBusinessDaySchema,
  type BusinessDay,
} from "../schemas/business-day.schema";

type Result = { ok: true; data: BusinessDay } | { ok: false; error: string };

async function send(
  path: string,
  method: "PUT" | "DELETE",
  body?: unknown,
): Promise<Result> {
  const session = await getCurrentUserFromServer();
  if (
    session.status !== "authenticated" ||
    !isProtectedSuperAdmin(session.user)
  )
    return {
      ok: false,
      error: "Only Super Admin can change the business day.",
    };
  try {
    const payload = await requestComsApi<unknown>(path, {
      cookieHeader: (await cookies()).toString(),
      method,
      ...(body ? { body } : {}),
    });
    revalidatePath(businessDayRoute);
    return { ok: true, data: businessDaySchema.parse(payload) };
  } catch (error) {
    if (
      error instanceof ApiRequestError &&
      error.status < 500 &&
      error.status !== 401
    )
      return { ok: false, error: error.message };
    return {
      ok: false,
      error: "The business day could not be saved. Try again.",
    };
  }
}

export async function scheduleBusinessDayAction(input: unknown) {
  const parsed = scheduleBusinessDaySchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Check the settings.",
    };
  return send(businessDayEndpoint, "PUT", parsed.data);
}

export async function cancelScheduledBusinessDayAction() {
  return send(`${businessDayEndpoint}/scheduled`, "DELETE");
}
