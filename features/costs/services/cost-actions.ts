"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import {
  branchProfitSchema,
  productCostPageSchema,
  productProfitPageSchema,
  setStockCostSchema,
  stockCostPageSchema,
} from "../schemas/cost.schema";

export type CostResult<T> =
  { ok: true; data: T } | { ok: false; error: string };

async function load<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  init?: {
    method: "PUT";
    body: unknown;
  },
): Promise<CostResult<T>> {
  try {
    const payload = await requestComsApi<unknown>(endpoint, {
      cookieHeader: (await cookies()).toString(),
      ...init,
    });
    const parsed = schema.safeParse(payload);
    if (!parsed.success)
      throw new ApiRequestError("Invalid cost response.", 502);
    return { ok: true, data: parsed.data };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const message =
        error.status === 401
          ? "Your session expired. Sign in again."
          : error.status === 403
            ? "You don't have access to these costs."
            : error.message;
      return { ok: false, error: message };
    }
    return { ok: false, error: "COMS could not load costs. Try again." };
  }
}

function params(values: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== "") query.set(key, String(value));
  return query.toString();
}

const rangeInput = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  branch_id: z.uuid().optional(),
  page: z.number().int().positive().optional(),
  page_size: z.number().int().positive().optional(),
});

export async function getBranchProfitAction(input: unknown) {
  const query = rangeInput.parse(input);
  return load(
    `/costs/branches?${params({ from: query.from, to: query.to })}`,
    branchProfitSchema,
  );
}

export async function getProductProfitAction(input: unknown) {
  const query = rangeInput.parse(input);
  return load(
    `/costs/branch-products?${params(query)}`,
    productProfitPageSchema,
  );
}

export async function getProductCostsAction(input: unknown) {
  const query = z
    .object({
      search: z.string().max(100),
      status: z.enum(["all", "incomplete"]),
      page: z.number().int().positive(),
      page_size: z.number().int().positive(),
    })
    .parse(input);
  return load(`/costs/products?${params(query)}`, productCostPageSchema);
}

export async function getStockCostsAction(input: unknown) {
  const query = z
    .object({
      search: z.string().max(100),
      missing_only: z.boolean(),
      page: z.number().int().positive(),
      page_size: z.number().int().positive(),
    })
    .parse(input);
  return load(
    `/costs/stock-items?${params({ ...query, missing_only: query.missing_only ? "true" : undefined })}`,
    stockCostPageSchema,
  );
}

export async function setStockCostAction(id: string, input: unknown) {
  const parsed = setStockCostSchema.safeParse(input);
  if (!z.uuid().safeParse(id).success || !parsed.success)
    return {
      ok: false as const,
      error: parsed.error?.issues[0]?.message ?? "Check the cost details.",
    };
  return load(`/costs/stock-items/${id}`, z.unknown(), {
    method: "PUT",
    body: parsed.data,
  });
}
