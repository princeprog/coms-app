"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { hasBranchScope, hasPermission } from "@/features/auth/permissions";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import { shiftsEndpoint } from "../constants";
import {
  pesoInputSchema,
  shiftDetailSchema,
  shiftPageSchema,
  shiftQuerySchema,
  type ShiftDetail,
  type ShiftPage,
  type ShiftResult,
} from "../schemas/shift.schema";

type ShiftPermission = "shifts.read" | "shifts.operate" | "shifts.review";

async function authorize(branchId: unknown, permission: ShiftPermission) {
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
      error: "You do not have permission for this shift action.",
    };
  if (!hasBranchScope(session.user, branch.data))
    return {
      ok: false as const,
      error: "You do not have access to this branch.",
    };
  return { ok: true as const, branchId: branch.data };
}

function failure(error: unknown): { ok: false; error: string; code?: string } {
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
  return {
    ok: false,
    error: "COMS could not complete this shift action. Try again.",
  };
}

async function call<T>(
  path: string,
  parse: (value: unknown) => T,
  init: { method?: "GET" | "POST"; body?: unknown; key?: string } = {},
): Promise<ShiftResult<T>> {
  try {
    const payload = await requestComsApi<unknown>(path, {
      cookieHeader: (await cookies()).toString(),
      method: init.method ?? "GET",
      ...(init.body !== undefined ? { body: init.body } : {}),
      ...(init.key ? { headers: { "Idempotency-Key": init.key } } : {}),
    });
    return { ok: true, data: parse(payload) };
  } catch (error) {
    return failure(error);
  }
}

const detail = (value: unknown) => shiftDetailSchema.parse(value);
const keySchema = z.uuid();

export async function getCurrentShiftAction(
  branchId: unknown,
): Promise<ShiftResult<ShiftDetail | null>> {
  const access = await authorize(branchId, "shifts.read");
  if (!access.ok) return access;
  return call(
    `${shiftsEndpoint(access.branchId)}/current`,
    (value) =>
      z.object({ shift: shiftDetailSchema.nullable() }).parse(value).shift,
  );
}

/** The signed-in user's own open shift at any branch they can access. */
export async function getMyShiftAction(): Promise<
  ShiftResult<ShiftDetail | null>
> {
  const session = await getCurrentUserFromServer();
  if (session.status !== "authenticated")
    return { ok: false, error: "Your session expired. Sign in again." };
  if (!hasPermission(session.user, "shifts.read"))
    return { ok: true, data: null };
  return call(
    "/shifts/mine",
    (value) =>
      z.object({ shift: shiftDetailSchema.nullable() }).parse(value).shift,
  );
}

export async function listShiftsAction(
  branchId: unknown,
  query: unknown,
): Promise<ShiftResult<ShiftPage>> {
  const access = await authorize(branchId, "shifts.read");
  if (!access.ok) return access;
  const parsed = shiftQuerySchema.parse(query ?? {});
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(parsed))
    if (value !== "") params.set(name, String(value));
  return call(`${shiftsEndpoint(access.branchId)}?${params}`, (value) =>
    shiftPageSchema.parse(value),
  );
}

export async function getShiftAction(
  branchId: unknown,
  shiftId: unknown,
): Promise<ShiftResult<ShiftDetail>> {
  const access = await authorize(branchId, "shifts.read");
  if (!access.ok) return access;
  const id = z.uuid().safeParse(shiftId);
  if (!id.success)
    return { ok: false, error: "That shift could not be found." };
  return call(`${shiftsEndpoint(access.branchId)}/${id.data}`, detail);
}

export async function openShiftAction(
  branchId: unknown,
  openingFloat: unknown,
  key: unknown,
): Promise<ShiftResult<ShiftDetail>> {
  const access = await authorize(branchId, "shifts.operate");
  if (!access.ok) return access;
  const amount = pesoInputSchema.safeParse(openingFloat);
  if (!amount.success || !keySchema.safeParse(key).success)
    return { ok: false, error: "Enter the cash in the drawer." };
  return call(shiftsEndpoint(access.branchId), detail, {
    method: "POST",
    body: { opening_float: amount.data },
    key: key as string,
  });
}

export async function shiftCashMovementAction(
  branchId: unknown,
  shiftId: unknown,
  input: unknown,
  key: unknown,
): Promise<ShiftResult<ShiftDetail>> {
  const access = await authorize(branchId, "shifts.operate");
  if (!access.ok) return access;
  const parsed = z
    .object({
      direction: z.enum(["IN", "OUT"]),
      amount: pesoInputSchema,
      reason: z.string().trim().min(1).max(300),
    })
    .safeParse(input);
  const id = z.uuid().safeParse(shiftId);
  if (!parsed.success || !id.success || !keySchema.safeParse(key).success)
    return { ok: false, error: "Enter an amount and a reason." };
  return call(
    `${shiftsEndpoint(access.branchId)}/${id.data}/cash-movements`,
    detail,
    {
      method: "POST",
      body: parsed.data,
      key: key as string,
    },
  );
}

const countSchema = z.object({
  counted_cash: pesoInputSchema,
  left_in_drawer: pesoInputSchema,
});

export async function closeShiftAction(
  branchId: unknown,
  shiftId: unknown,
  input: unknown,
  key: unknown,
): Promise<ShiftResult<ShiftDetail>> {
  const access = await authorize(branchId, "shifts.operate");
  if (!access.ok) return access;
  const parsed = countSchema.safeParse(input);
  const id = z.uuid().safeParse(shiftId);
  if (!parsed.success || !id.success || !keySchema.safeParse(key).success)
    return {
      ok: false,
      error: "Enter the counted cash and the cash left in the drawer.",
    };
  return call(`${shiftsEndpoint(access.branchId)}/${id.data}/close`, detail, {
    method: "POST",
    body: parsed.data,
    key: key as string,
  });
}

export async function forceCloseShiftAction(
  branchId: unknown,
  shiftId: unknown,
  input: unknown,
  key: unknown,
): Promise<ShiftResult<ShiftDetail>> {
  const access = await authorize(branchId, "shifts.review");
  if (!access.ok) return access;
  const parsed = countSchema
    .extend({ reason: z.string().trim().min(1).max(500) })
    .safeParse(input);
  const id = z.uuid().safeParse(shiftId);
  if (!parsed.success || !id.success || !keySchema.safeParse(key).success)
    return {
      ok: false,
      error: "Enter the counted cash, cash left and a reason.",
    };
  return call(
    `${shiftsEndpoint(access.branchId)}/${id.data}/force-close`,
    detail,
    {
      method: "POST",
      body: parsed.data,
      key: key as string,
    },
  );
}

export async function explainShiftAction(
  branchId: unknown,
  shiftId: unknown,
  explanation: unknown,
): Promise<ShiftResult<ShiftDetail>> {
  const access = await authorize(branchId, "shifts.operate");
  if (!access.ok) return access;
  const text = z.string().trim().min(1).max(500).safeParse(explanation);
  const id = z.uuid().safeParse(shiftId);
  if (!text.success || !id.success)
    return { ok: false, error: "Enter an explanation." };
  return call(
    `${shiftsEndpoint(access.branchId)}/${id.data}/explanation`,
    detail,
    {
      method: "POST",
      body: { explanation: text.data },
    },
  );
}

export async function reviewShiftAction(
  branchId: unknown,
  shiftId: unknown,
  note: unknown,
): Promise<ShiftResult<ShiftDetail>> {
  const access = await authorize(branchId, "shifts.review");
  if (!access.ok) return access;
  const text = z
    .string()
    .trim()
    .max(500)
    .safeParse(note ?? "");
  const id = z.uuid().safeParse(shiftId);
  if (!text.success || !id.success)
    return { ok: false, error: "Check the review note." };
  return call(`${shiftsEndpoint(access.branchId)}/${id.data}/review`, detail, {
    method: "POST",
    body: text.data ? { note: text.data } : {},
  });
}
