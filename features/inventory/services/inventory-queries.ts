import "server-only";

import { cookies } from "next/headers";
import { branchesResponseSchema } from "@/features/branches/schemas/branch.schema";
import { inventoryEndpoints } from "@/features/inventory/constants";
import {
  inventoryMovementPageSchema,
  inventoryPageSchema,
} from "@/features/inventory/schemas/inventory.schema";
import type {
  InventoryMovementPage,
  InventoryPage,
} from "@/features/inventory/types/inventory.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

type InventoryPageRequest =
  | {
      page: number;
      search: string;
      scope: "COMMISSARY";
      pageSize?: number;
    }
  | {
      page: number;
      search: string;
      scope: "BRANCH";
      branchId: string;
      pageSize?: number;
    };

export async function getInventoryPageData(
  request: InventoryPageRequest,
): Promise<{
  inventory: InventoryPage;
  movements: InventoryMovementPage;
}> {
  const { scope, page, search, pageSize = 25 } = request;
  const branchId = request.scope === "BRANCH" ? request.branchId : "";
  const balancePath =
    scope === "COMMISSARY"
      ? inventoryEndpoints.commissary
      : inventoryEndpoints.branch(branchId);
  const movementPath =
    scope === "COMMISSARY"
      ? inventoryEndpoints.commissaryMovements
      : inventoryEndpoints.branchMovements(branchId);
  const balanceParams = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (search.trim()) balanceParams.set("search", search.trim());
  const movementParams = new URLSearchParams({
    page: "1",
    page_size: String(pageSize),
  });
  const cookieHeader = (await cookies()).toString();

  const [inventoryPayload, movementPayload] = await Promise.all([
    requestComsApi<unknown>(`${balancePath}?${balanceParams}`, {
      cookieHeader,
    }),
    requestComsApi<unknown>(`${movementPath}?${movementParams}`, {
      cookieHeader,
    }),
  ]);
  const inventory = inventoryPageSchema.safeParse(inventoryPayload);
  if (!inventory.success)
    throw new ApiRequestError("Invalid inventory response.", 502);
  const movements = inventoryMovementPageSchema.safeParse(movementPayload);
  if (!movements.success)
    throw new ApiRequestError("Invalid inventory movements response.", 502);

  return { inventory: inventory.data, movements: movements.data };
}

export async function getInventoryBranchOptions(): Promise<
  { id: string; name: string; status: "active" | "inactive" }[]
> {
  const cookieHeader = (await cookies()).toString();
  const pageSize = 100;
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
      status: branch.status,
    })),
  );
}
