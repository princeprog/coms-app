import "server-only";

import { cookies } from "next/headers";
import { staffEndpoints } from "@/features/staff/constants";
import { staffPageSchema } from "@/features/staff/schemas/staff.schema";
import type { StaffPage } from "@/features/staff/types/staff.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

export type StaffPageRequest = {
  page: number;
  pageSize: number;
  search?: string;
  branchId?: string;
};

export async function getStaffPageData({
  page,
  pageSize,
  search,
  branchId,
}: StaffPageRequest): Promise<StaffPage> {
  const query = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (branchId) query.set("branch_id", branchId);
  if (search?.trim()) query.set("search", search.trim());

  const payload = await requestComsApi<unknown>(
    `${staffEndpoints.collection}?${query}`,
    {
      cookieHeader: (await cookies()).toString(),
    },
  );
  const parsed = staffPageSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiRequestError("Invalid staff administration response.", 502);
  }
  return parsed.data;
}
