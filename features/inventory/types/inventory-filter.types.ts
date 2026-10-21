import type { InventoryBranchOption } from "./inventory.types";

export type InventoryScopeFilterProps = {
  scope: "COMMISSARY" | "BRANCH";
  branchOptions: InventoryBranchOption[];
  selectedBranchId?: string;
  search: string;
  statusFilter?: "active" | "inactive";
  categoryFilter?: string;
  stockFilter?: "low";
  availableCategories: string[];
  canViewCommissary: boolean;
  canViewBranch: boolean;
  branchName: string;
  page: number;
  pageSize?: number;
  onPendingChange: (pending: boolean) => void;
};
