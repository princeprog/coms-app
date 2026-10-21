"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import { auditEndpoints } from "../constants";
import {
  auditAreaValues,
  auditEventPageSchema,
  type AuditEventPage,
} from "../schemas/audit.schema";

export type AuditResult =
  { ok: true; data: AuditEventPage } | { ok: false; error: string };

const listInput = z.object({
  area: z.enum(auditAreaValues).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  search: z.string().max(100),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

export async function getAuditEventsAction(
  input: unknown,
): Promise<AuditResult> {
  const query = listInput.parse(input);
  const params = new URLSearchParams({
    page: String(query.page),
    page_size: String(query.page_size),
  });
  if (query.area) params.set("entity_type", query.area);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.search) params.set("search", query.search);
  try {
    const payload = await requestComsApi<unknown>(
      `${auditEndpoints.events}?${params}`,
      { cookieHeader: (await cookies()).toString() },
    );
    const parsed = auditEventPageSchema.safeParse(payload);
    if (!parsed.success)
      return { ok: false, error: "COMS returned an unexpected audit log." };
    return { ok: true, data: parsed.data };
  } catch (error) {
    if (error instanceof ApiRequestError)
      return {
        ok: false,
        error:
          error.status === 401
            ? "Your session expired. Sign in again."
            : error.status === 403
              ? "You don't have access to the audit log."
              : error.message,
      };
    return {
      ok: false,
      error: "COMS could not load the audit log. Try again.",
    };
  }
}
