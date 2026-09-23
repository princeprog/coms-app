import { z } from "zod";

const branchIdSchema = z.uuid();
const pageMaxValue = 1_000_000;
const searchMaxLength = 120;

export type InventoryPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type InventoryPageFilters = {
  page: number;
  scope: "COMMISSARY" | "BRANCH";
  search: string;
  requestedBranchId?: string;
};

export function parseInventoryPageFilters(
  params: InventoryPageSearchParams,
): InventoryPageFilters {
  const rawPage = first(params.page);
  const parsedPage = Number(rawPage);
  const page =
    Number.isInteger(parsedPage) &&
    parsedPage >= 1 &&
    parsedPage <= pageMaxValue
      ? parsedPage
      : 1;
  const scope = first(params.scope) === "BRANCH" ? "BRANCH" : "COMMISSARY";
  const search = (first(params.search) ?? "").trim().slice(0, searchMaxLength);
  const parsedBranchId = branchIdSchema.safeParse(first(params.branch_id));

  return {
    page,
    scope,
    search,
    ...(parsedBranchId.success
      ? { requestedBranchId: parsedBranchId.data.toLowerCase() }
      : {}),
  };
}

export type InventoryBranchSelection =
  | { status: "ready"; branchId: string | undefined }
  | { status: "no-branch" }
  | { status: "out-of-scope" };

export function createInventoryHref({
  scope,
  branchId,
  page,
  search,
}: {
  scope: "COMMISSARY" | "BRANCH";
  branchId?: string;
  page: number;
  search: string;
}) {
  const params = new URLSearchParams();
  params.set("scope", scope);
  if (scope === "BRANCH" && branchId) params.set("branch_id", branchId);
  if (page > 1) params.set("page", String(page));
  if (search.trim()) params.set("search", search.trim());
  return `/inventory?${params}`;
}

export function resolveInventoryBranchSelection({
  isSuperAdmin,
  assignedBranchIds,
  requestedBranchId,
}: {
  isSuperAdmin: boolean;
  assignedBranchIds: string[];
  requestedBranchId?: string;
}): InventoryBranchSelection {
  if (isSuperAdmin) return { status: "ready", branchId: requestedBranchId };
  if (assignedBranchIds.length === 0) return { status: "no-branch" };

  const assigned = new Set(assignedBranchIds.map((id) => id.toLowerCase()));
  if (requestedBranchId && !assigned.has(requestedBranchId.toLowerCase())) {
    return { status: "out-of-scope" };
  }

  return {
    status: "ready",
    branchId: requestedBranchId ?? assignedBranchIds[0],
  };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
