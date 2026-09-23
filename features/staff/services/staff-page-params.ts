import { z } from "zod";

const branchIdSchema = z.string().uuid();
const SEARCH_MAX_LENGTH = 120;
const PAGE_MAX_VALUE = 1_000_000;

export type StaffPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type StaffPageFilters = {
  page: number;
  search: string;
  requestedBranchId?: string;
};

export function createStaffPageHref(
  page: number,
  branchId: string | undefined,
  search: string,
): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (branchId) params.set("branch_id", branchId);
  if (search) params.set("search", search);
  const query = params.toString();
  return query ? `/staff?${query}` : "/staff";
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseStaffPageFilters(
  params: StaffPageSearchParams,
): StaffPageFilters {
  const rawPage = firstValue(params.page);
  const parsedPage = Number(rawPage);
  const page =
    Number.isInteger(parsedPage) &&
    parsedPage >= 1 &&
    parsedPage <= PAGE_MAX_VALUE
      ? parsedPage
      : 1;
  const search = (firstValue(params.search) ?? "")
    .trim()
    .slice(0, SEARCH_MAX_LENGTH);
  const rawBranchId = firstValue(params.branch_id);
  const parsedBranchId = branchIdSchema.safeParse(rawBranchId);
  const requestedBranchId = parsedBranchId.success
    ? parsedBranchId.data.toLowerCase()
    : undefined;

  return { page, search, requestedBranchId };
}

export type StaffBranchSelection =
  | { status: "ready"; branchId: string | undefined }
  | { status: "no-branch" }
  | { status: "out-of-scope" };

export function resolveStaffBranchSelection({
  isSuperAdmin,
  assignedBranchIds,
  requestedBranchId,
}: {
  isSuperAdmin: boolean;
  assignedBranchIds: string[];
  requestedBranchId?: string;
}): StaffBranchSelection {
  if (isSuperAdmin) {
    return { status: "ready", branchId: requestedBranchId };
  }
  if (assignedBranchIds.length === 0) return { status: "no-branch" };
  if (requestedBranchId && !assignedBranchIds.includes(requestedBranchId)) {
    return { status: "out-of-scope" };
  }

  return {
    status: "ready",
    branchId: requestedBranchId ?? assignedBranchIds[0],
  };
}
