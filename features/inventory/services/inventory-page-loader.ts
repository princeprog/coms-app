import "server-only";

import { hasPermission } from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";
import type {
  InventoryBranchOption,
  InventoryMovementPage,
  InventoryPage,
} from "@/features/inventory/types/inventory.types";
import { ApiRequestError } from "@/services/api-services";
import {
  createInventoryHref,
  parseInventoryPageFilters,
  resolveInventoryBranchSelection,
  type InventoryPageSearchParams,
} from "./inventory-page-params";
import {
  getInventoryBranchOptions,
  getInventoryPageData,
} from "./inventory-queries";

export type InventoryViewResult =
  | { status: "forbidden" }
  | { status: "session-expired" }
  | { status: "branch-options-error" }
  | { status: "inventory-error" }
  | {
      status: "branch-unavailable";
      branchOptions: InventoryBranchOption[];
      search: string;
      message: string;
      canViewCommissary: boolean;
      canViewBranch: boolean;
    }
  | { status: "redirect"; href: string }
  | {
      status: "ready";
      inventory: InventoryPage;
      movements: InventoryMovementPage;
      scope: "COMMISSARY" | "BRANCH";
      branchOptions: InventoryBranchOption[];
      selectedBranchId?: string;
      search: string;
      statusFilter?: "active" | "inactive";
      categoryFilter?: string;
      page: number;
      canAdjust: boolean;
      canViewCommissary: boolean;
      canViewBranch: boolean;
    };

type InventoryDataResult =
  | {
      status: "loaded";
      data: Awaited<ReturnType<typeof getInventoryPageData>>;
    }
  | { status: "error"; error: unknown };

async function loadPageData(
  request: Parameters<typeof getInventoryPageData>[0],
): Promise<InventoryDataResult> {
  try {
    return { status: "loaded", data: await getInventoryPageData(request) };
  } catch (error) {
    return { status: "error", error };
  }
}

type AccessFailure = { status: "forbidden" } | { status: "session-expired" };

function getAccessFailure(error: unknown): AccessFailure | null {
  if (!(error instanceof ApiRequestError)) return null;
  if (error.status === 401) return { status: "session-expired" };
  if (error.status === 403) return { status: "forbidden" };
  return null;
}

function isProtectedSuperAdmin(user: User) {
  return Boolean(
    user.role?.isSystem &&
    user.role.isActive &&
    user.role.code === "SUPER_ADMIN",
  );
}

export async function loadInventoryView(
  user: User,
  searchParams: InventoryPageSearchParams,
): Promise<InventoryViewResult> {
  const filters = parseInventoryPageFilters(searchParams);
  const canViewBranch = hasPermission(user, "inventory.read");
  const canViewCommissary = hasPermission(user, "inventory.commissary_read");
  if (!canViewBranch && !canViewCommissary) return { status: "forbidden" };
  if (
    (filters.scope === "BRANCH" && !canViewBranch) ||
    (filters.scope === "COMMISSARY" && !canViewCommissary)
  ) {
    return { status: "forbidden" };
  }
  const scope = filters.scope ?? (canViewCommissary ? "COMMISSARY" : "BRANCH");
  const isSuperAdmin = isProtectedSuperAdmin(user);
  const assignedBranchIds = user.branch_ids ?? [];
  let branchOptions: InventoryBranchOption[] = [];
  let branchOptionsFailed = false;

  if (canViewBranch && hasPermission(user, "branches.read")) {
    try {
      const allBranches = await getInventoryBranchOptions();
      const assigned = new Set(assignedBranchIds.map((id) => id.toLowerCase()));
      branchOptions = isSuperAdmin
        ? allBranches
        : allBranches.filter((branch) => assigned.has(branch.id.toLowerCase()));
    } catch (error) {
      const accessFailure = getAccessFailure(error);
      if (accessFailure) return accessFailure;
      branchOptionsFailed = true;
    }
  } else if (canViewBranch) {
    branchOptions = assignedBranchIds.map((id, index) => ({
      id: id.toLowerCase(),
      name:
        assignedBranchIds.length === 1
          ? "Assigned branch"
          : `Assigned branch ${index + 1}`,
    }));
  }

  const branchSelection = resolveInventoryBranchSelection({
    isSuperAdmin,
    assignedBranchIds,
    requestedBranchId: filters.requestedBranchId,
  });
  if (scope === "BRANCH" && branchSelection.status === "out-of-scope") {
    return { status: "forbidden" };
  }
  const selectedBranchId =
    branchSelection.status === "ready"
      ? (branchSelection.branchId ?? branchOptions[0]?.id)
      : undefined;

  if (branchOptionsFailed) {
    return { status: "branch-options-error" };
  }

  if (scope === "BRANCH" && !selectedBranchId) {
    const message =
      branchSelection.status === "no-branch"
        ? "Ask an administrator to assign a branch before viewing branch inventory."
        : isSuperAdmin
          ? "Create a branch before viewing branch inventory."
          : "No assigned branch is currently available.";
    return {
      status: "branch-unavailable",
      branchOptions,
      search: filters.search,
      message,
      canViewCommissary,
      canViewBranch,
    };
  }

  if (
    scope === "BRANCH" &&
    !branchOptions.some(
      (branch) => branch.id.toLowerCase() === selectedBranchId?.toLowerCase(),
    )
  ) {
    return { status: "forbidden" };
  }

  const dataResult = await loadPageData(
    scope === "BRANCH"
      ? {
          scope: "BRANCH",
          branchId: selectedBranchId!,
          page: filters.page,
          search: filters.search,
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.category ? { category: filters.category } : {}),
        }
      : {
          scope: "COMMISSARY",
          page: filters.page,
          search: filters.search,
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.category ? { category: filters.category } : {}),
        },
  );
  if (dataResult.status === "error") {
    const accessFailure = getAccessFailure(dataResult.error);
    if (accessFailure) return accessFailure;
    return { status: "inventory-error" };
  }

  const { inventory, movements } = dataResult.data;
  const pageCount = Math.max(
    1,
    Math.ceil(inventory.total / inventory.page_size),
  );
  if (filters.page > pageCount) {
    return {
      status: "redirect",
      href: createInventoryHref({
        scope,
        branchId: selectedBranchId,
        page: pageCount,
        search: filters.search,
        status: filters.status,
        category: filters.category,
      }),
    };
  }

  const selectedBranch = branchOptions.find(
    (branch) => branch.id.toLowerCase() === selectedBranchId?.toLowerCase(),
  );
  return {
    status: "ready",
    inventory,
    movements,
    scope,
    branchOptions,
    selectedBranchId,
    search: filters.search,
    statusFilter: filters.status,
    categoryFilter: filters.category,
    page: filters.page,
    canAdjust:
      scope === "COMMISSARY"
        ? hasPermission(user, "inventory.commissary_adjust")
        : hasPermission(user, "inventory.adjust") &&
          selectedBranch?.status !== "inactive",
    canViewCommissary,
    canViewBranch,
  };
}
