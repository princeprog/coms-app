import "server-only";

import { cookies } from "next/headers";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import { branchesResponseSchema } from "@/features/branches/schemas/branch.schema";
import type { BranchDirectoryFilters } from "../types/branch.types";
import { branchDirectorySort } from "./branch-directory-params";

export async function getBranchPageData(
  page: number,
  search = "",
  filters?: BranchDirectoryFilters,
) {
  const cookieHeader = (await cookies()).toString();
  const params = new URLSearchParams({
    page: String(page),
    page_size: filters ? "8" : "25",
  });
  if (search) params.set("search", search);
  if (filters) {
    if (filters.status) params.set("status", filters.status);
    if (filters.service_type) params.set("service_type", filters.service_type);
    const sort = branchDirectorySort(filters.sort);
    params.set("sort_by", sort.sort_by);
    params.set("sort_order", sort.sort_order);
  }
  const payload = await requestComsApi<unknown>(
    `/branches?${params.toString()}`,
    { cookieHeader },
  );
  const parsed = branchesResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiRequestError("Invalid branch administration response.", 502);
  }
  return parsed.data;
}
