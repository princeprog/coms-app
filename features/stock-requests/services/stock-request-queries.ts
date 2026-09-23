import "server-only";

import { cookies } from "next/headers";
import { branchesResponseSchema } from "@/features/branches/schemas/branch.schema";
import type { Branch } from "@/features/branches/types/branch.types";
import { stockItemPageSchema } from "@/features/stock-items/schemas/stock-item.schema";
import { stockItemsEndpoint } from "@/features/stock-items/constants";
import { stockRequestsEndpoint } from "@/features/stock-requests/constants";
import {
  stockRequestDetailSchema,
  stockRequestPageSchema,
} from "@/features/stock-requests/schemas/stock-request.schema";
import type {
  StockRequestFormOptions,
  StockRequestPage,
  StockRequestStatus,
} from "@/features/stock-requests/types/stock-request.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

const optionPageSize = 100;

export async function getStockRequestPageData({
  page,
  branch_id,
  status,
}: {
  page: number;
  branch_id?: string;
  status?: StockRequestStatus;
}): Promise<StockRequestPage> {
  const params = new URLSearchParams({ page: String(page), page_size: "25" });
  if (branch_id) params.set("branch_id", branch_id);
  if (status) params.set("status", status);
  const payload = await requestComsApi<unknown>(
    `${stockRequestsEndpoint}?${params}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = stockRequestPageSchema.safeParse(payload);
  if (!parsed.success || parsed.data.page !== page)
    throw new ApiRequestError("Invalid stock request response.", 502);
  return parsed.data;
}

export async function getStockRequestDetail(id: string) {
  if (!zUuid(id)) throw new ApiRequestError("Stock request not found.", 404);
  const payload = await requestComsApi<unknown>(
    `${stockRequestsEndpoint}/${id}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = stockRequestDetailSchema.safeParse(payload);
  if (!parsed.success)
    throw new ApiRequestError("Invalid stock request detail.", 502);
  return parsed.data;
}

export async function getStockRequestFormOptions(
  allowedBranchIds: string[] | null,
): Promise<StockRequestFormOptions> {
  const cookieHeader = (await cookies()).toString();
  const [allBranches, stockItems] = await Promise.all([
    getAllPages("/branches", branchesResponseSchema, cookieHeader),
    getAllPages(
      stockItemsEndpoint,
      stockItemPageSchema,
      cookieHeader,
      "&is_active=true",
    ),
  ]);
  const branches = allBranches.filter(
    (branch) =>
      branch.status === "active" &&
      (allowedBranchIds === null || allowedBranchIds.includes(branch.id)),
  );
  return { branches, stockItems };
}

export async function getStockRequestBranches(
  allowedBranchIds: string[] | null,
): Promise<Branch[]> {
  const cookieHeader = (await cookies()).toString();
  const branches = await getAllPages(
    "/branches",
    branchesResponseSchema,
    cookieHeader,
  );
  return branches.filter(
    (branch) =>
      branch.status === "active" &&
      (allowedBranchIds === null || allowedBranchIds.includes(branch.id)),
  );
}

type PageData<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

type PageParser<T> = {
  safeParse: (
    payload: unknown,
  ) =>
    { success: true; data: PageData<T> } | { success: false; error: unknown };
};

async function getAllPages<T>(
  endpoint: string,
  schema: PageParser<T>,
  cookieHeader: string,
  extraQuery = "",
): Promise<T[]> {
  const getPage = async (pageNumber: number) => {
    const params = new URLSearchParams({
      page: String(pageNumber),
      page_size: String(optionPageSize),
    });
    const payload = await requestComsApi<unknown>(
      `${endpoint}?${params}${extraQuery}`,
      { cookieHeader },
    );
    const parsed = schema.safeParse(payload);
    if (!parsed.success || parsed.data.page !== pageNumber) {
      throw new ApiRequestError("Invalid stock request options response.", 502);
    }
    return parsed.data;
  };

  const firstPage = await getPage(1);
  const pageCount = Math.ceil(firstPage.total / firstPage.page_size);
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
    throw new ApiRequestError(
      "Stock request options changed while loading.",
      502,
    );
  }
  return [firstPage, ...remainingPages].flatMap((page) => page.items);
}

function zUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
