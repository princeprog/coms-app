"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { hasBranchScope, hasPermission } from "@/features/auth/permissions";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import {
  myScheduleEndpoint,
  scheduleEndpoint,
  shiftTemplatesEndpoint,
} from "../constants";
import {
  myScheduleSchema,
  patternSchema,
  scheduleExceptionSchema,
  scheduleWeekSchema,
  shiftTemplateFormSchema,
  shiftTemplateListSchema,
  shiftTemplateSchema,
  type MySchedule,
  type ScheduleResult,
  type ScheduleWeek,
  type ShiftTemplate,
} from "../schemas/schedule.schema";

type SchedulePermission = "schedules.read" | "schedules.manage";
type Failure = { ok: false; error: string; code?: string };

async function authorize(branchId: unknown, permission: SchedulePermission) {
  const branch = z.uuid().safeParse(branchId);
  if (!branch.success)
    return { ok: false as const, error: "Select a valid branch." };
  const session = await getCurrentUserFromServer();
  if (session.status !== "authenticated")
    return {
      ok: false as const,
      error: "Your session expired. Sign in again.",
    };
  if (!hasPermission(session.user, permission))
    return {
      ok: false as const,
      error: "You do not have permission to change schedules.",
    };
  if (!hasBranchScope(session.user, branch.data))
    return {
      ok: false as const,
      error: "You do not have access to this branch.",
    };
  return { ok: true as const, branchId: branch.data };
}

function failure(error: unknown): Failure {
  if (error instanceof ApiRequestError) {
    if (error.status === 401)
      return { ok: false, error: "Your session expired. Sign in again." };
    const code =
      typeof error.payload === "object" &&
      error.payload !== null &&
      "code" in error.payload
        ? String(error.payload.code)
        : undefined;
    if (error.status < 500) return { ok: false, error: error.message, code };
  }
  return { ok: false, error: "COMS could not update the schedule. Try again." };
}

async function call<T>(
  path: string,
  parse: (value: unknown) => T,
  init: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
  } = {},
): Promise<ScheduleResult<T>> {
  try {
    const payload = await requestComsApi<unknown>(path, {
      cookieHeader: (await cookies()).toString(),
      method: init.method ?? "GET",
      ...(init.body !== undefined ? { body: init.body } : {}),
    });
    return { ok: true, data: parse(payload) };
  } catch (error) {
    return failure(error);
  }
}

const invalid = (error: z.ZodError): Failure => ({
  ok: false,
  error: error.issues[0]?.message ?? "Check the highlighted fields.",
});

export async function listShiftTemplatesAction(
  branchId: unknown,
): Promise<ScheduleResult<ShiftTemplate[]>> {
  const access = await authorize(branchId, "schedules.read");
  if (!access.ok) return access;
  return call(shiftTemplatesEndpoint(access.branchId), (value) =>
    shiftTemplateListSchema.parse(value),
  );
}

export async function saveShiftTemplateAction(
  branchId: unknown,
  input: unknown,
  existing?: { id: string; revision: number },
): Promise<ScheduleResult<ShiftTemplate>> {
  const access = await authorize(branchId, "schedules.manage");
  if (!access.ok) return access;
  const parsed = shiftTemplateFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const target = existing ? z.uuid().safeParse(existing.id) : null;
  if (target && !target.success)
    return { ok: false, error: "This shift could not be found." };
  return call(
    target
      ? `${shiftTemplatesEndpoint(access.branchId)}/${target.data}`
      : shiftTemplatesEndpoint(access.branchId),
    (value) => shiftTemplateSchema.parse(value),
    {
      method: target ? "PATCH" : "POST",
      body: existing
        ? { ...parsed.data, revision: existing.revision }
        : parsed.data,
    },
  );
}

export async function setShiftTemplateActiveAction(
  branchId: unknown,
  templateId: unknown,
  active: boolean,
): Promise<ScheduleResult<ShiftTemplate>> {
  const access = await authorize(branchId, "schedules.manage");
  if (!access.ok) return access;
  const id = z.uuid().safeParse(templateId);
  if (!id.success)
    return { ok: false, error: "This shift could not be found." };
  return call(
    `${shiftTemplatesEndpoint(access.branchId)}/${id.data}/${active ? "reactivate" : "deactivate"}`,
    (value) => shiftTemplateSchema.parse(value),
    { method: "POST" },
  );
}

export async function getScheduleWeekAction(
  branchId: unknown,
  week?: string,
): Promise<ScheduleResult<ScheduleWeek>> {
  const access = await authorize(branchId, "schedules.read");
  if (!access.ok) return access;
  const date = z.iso
    .date()
    .optional()
    .safeParse(week || undefined);
  const query = date.success && date.data ? `?week=${date.data}` : "";
  return call(`${scheduleEndpoint(access.branchId)}${query}`, (value) =>
    scheduleWeekSchema.parse(value),
  );
}

export async function saveStaffPatternAction(
  branchId: unknown,
  userId: unknown,
  assignments: unknown,
): Promise<ScheduleResult<{ saved: true }>> {
  const access = await authorize(branchId, "schedules.manage");
  if (!access.ok) return access;
  const user = z.uuid().safeParse(userId);
  const parsed = patternSchema.safeParse(assignments);
  if (!user.success) return { ok: false, error: "Choose a staff member." };
  if (!parsed.success) return invalid(parsed.error);
  return call(
    `${scheduleEndpoint(access.branchId)}/pattern/${user.data}`,
    () => ({ saved: true as const }),
    { method: "PUT", body: { assignments: parsed.data } },
  );
}

export async function addScheduleExceptionAction(
  branchId: unknown,
  input: unknown,
): Promise<ScheduleResult<{ saved: true }>> {
  const access = await authorize(branchId, "schedules.manage");
  if (!access.ok) return access;
  const parsed = scheduleExceptionSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return call(
    `${scheduleEndpoint(access.branchId)}/exceptions`,
    () => ({ saved: true as const }),
    {
      method: "POST",
      body: { ...parsed.data, reason: parsed.data.reason || undefined },
    },
  );
}

export async function removeScheduleExceptionAction(
  branchId: unknown,
  exceptionId: unknown,
): Promise<ScheduleResult<{ saved: true }>> {
  const access = await authorize(branchId, "schedules.manage");
  if (!access.ok) return access;
  const id = z.uuid().safeParse(exceptionId);
  if (!id.success)
    return { ok: false, error: "This change could not be found." };
  return call(
    `${scheduleEndpoint(access.branchId)}/exceptions/${id.data}`,
    () => ({ saved: true as const }),
    { method: "DELETE" },
  );
}

/** The signed-in user's shifts for the next two weeks, at every branch. */
export async function getMyScheduleAction(): Promise<
  ScheduleResult<MySchedule>
> {
  const session = await getCurrentUserFromServer();
  if (session.status !== "authenticated")
    return { ok: false, error: "Your session expired. Sign in again." };
  return call(myScheduleEndpoint, (value) => myScheduleSchema.parse(value));
}
