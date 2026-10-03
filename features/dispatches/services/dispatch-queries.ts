import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";
import {
  dispatchDetailSchema,
  dispatchPageSchema,
} from "@/features/dispatches/schemas/dispatch.schema";
import type { DispatchPage } from "@/features/dispatches/types/dispatch.types";
import { dispatchesEndpoint } from "@/features/dispatches/constants";
import { branchesResponseSchema } from "@/features/branches/schemas/branch.schema";
import type { Branch } from "@/features/branches/types/branch.types";

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
  if (filters.discrepancyStatus !== "all")
    params.set("discrepancy_status", filters.discrepancyStatus);

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

export async function getDispatchCreateOptions(): Promise<{
  branches: Branch[];
  stockItems: [];
}> {
  const cookieHeader = (await cookies()).toString();
  const branches = await getAllCatalogPages(
    "/branches",
    cookieHeader,
    (payload) => branchesResponseSchema.safeParse(payload),
  );
  return {
    branches: branches.filter((branch) => branch.status === "active"),
    stockItems: [],
  };
}

async function getAllCatalogPages<T>(
  endpoint: string,
  cookieHeader: string,
  parse: (payload: unknown) =>
    | {
        success: true;
        data: { items: T[]; total: number; page: number; page_size: number };
      }
    | { success: false; error: unknown },
): Promise<T[]> {
  const pageSize = 100;
  const firstPage = await fetchCatalogPage(
    endpoint,
    cookieHeader,
    1,
    pageSize,
    parse,
  );
  const pages = [firstPage];
  const pageCount = Math.ceil(firstPage.total / firstPage.page_size);
  for (let page = 2; page <= pageCount; page++) {
    pages.push(
      await fetchCatalogPage(endpoint, cookieHeader, page, pageSize, parse),
    );
  }
  if (
    pages.some(
      (page) =>
        page.total !== firstPage.total ||
        page.page_size !== firstPage.page_size,
    )
  ) {
    throw new ApiRequestError("Dispatch catalogs changed while loading.", 502);
  }
  return pages.flatMap((page) => page.items);
}

async function fetchCatalogPage<T>(
  endpoint: string,
  cookieHeader: string,
  page: number,
  pageSize: number,
  parse: (payload: unknown) =>
    | {
        success: true;
        data: { items: T[]; total: number; page: number; page_size: number };
      }
    | { success: false; error: unknown },
) {
  const separator = endpoint.includes("?") ? "&" : "?";
  const payload = await requestComsApi<unknown>(
    `${endpoint}${separator}page=${page}&page_size=${pageSize}`,
    { cookieHeader },
  );
  const parsed = parse(payload);
  if (!parsed.success || parsed.data.page !== page) {
    throw new ApiRequestError(
      "Invalid dispatch catalog options response.",
      502,
    );
  }
  return parsed.data;
}
