import "server-only";

import { cookies } from "next/headers";
import { staffEndpoints } from "@/features/staff/constants";
import { staffPageSchema } from "@/features/staff/schemas/staff.schema";
import type { StaffPage } from "@/features/staff/types/staff.types";
import { branchesResponseSchema } from "@/features/branches/schemas/branch.schema";
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

export async function getStaffBranchOptions(): Promise<
  { id: string; name: string }[]
> {
  const pageSize = 100;
  const cookieHeader = (await cookies()).toString();
  const getPage = async (page: number) => {
    const payload = await requestComsApi<unknown>(
      `/branches?page=${page}&page_size=${pageSize}`,
      { cookieHeader },
    );
    const parsed = branchesResponseSchema.safeParse(payload);
    if (!parsed.success || parsed.data.page !== page) {
      throw new ApiRequestError("Invalid branch options response.", 502);
    }
    return parsed.data;
  };

  const firstPage = await getPage(1);
  const pageCount = Math.ceil(firstPage.total / firstPage.page_size);
  if (pageCount < 2) {
    return firstPage.items.map((branch) => ({
      id: branch.id,
      name: branch.branch_name,
    }));
  }

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => getPage(index + 2)),
  );
  if (
    remainingPages.some(
      (page) =>
        page.total !== firstPage.total ||
        page.page_size !== firstPage.page_size,
    )
  ) {
    throw new ApiRequestError("Branch options changed while loading.", 502);
  }

  return [firstPage, ...remainingPages].flatMap((page) =>
    page.items.map((branch) => ({
      id: branch.id,
      name: branch.branch_name,
    })),
  );
}
