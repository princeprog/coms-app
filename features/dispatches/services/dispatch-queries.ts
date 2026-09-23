import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";
import {
  dispatchDetailSchema,
  dispatchPageSchema,
} from "@/features/dispatches/schemas/dispatch.schema";
import type { DispatchPage } from "@/features/dispatches/types/dispatch.types";
import { dispatchesEndpoint } from "@/features/dispatches/constants";
import type { DispatchPageFilters } from "./dispatch-page-params";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

export async function getDispatchPageData(
  filters: DispatchPageFilters,
): Promise<DispatchPage> {
  const params = new URLSearchParams({
    page: String(filters.page),
    page_size: "25",
  });
  if (filters.status !== "all") params.set("status", filters.status);

  const payload = await requestComsApi<unknown>(
    `${dispatchesEndpoint}?${params.toString()}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = dispatchPageSchema.safeParse(payload);
  if (!parsed.success || parsed.data.page !== filters.page)
    throw new ApiRequestError("Invalid dispatch list response.", 502);
  return parsed.data;
}

export async function getDispatchDetail(id: string) {
  if (!z.uuid().safeParse(id).success)
    throw new ApiRequestError("Invalid dispatch ID.", 404);

  const payload = await requestComsApi<unknown>(`${dispatchesEndpoint}/${id}`, {
    cookieHeader: (await cookies()).toString(),
  });
  const parsed = dispatchDetailSchema.safeParse(payload);
  if (!parsed.success)
    throw new ApiRequestError("Invalid dispatch detail response.", 502);
  return parsed.data;
}
