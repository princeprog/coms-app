import type { InventoryBranchOption } from "./inventory.types";

export type InventoryScopeFilterProps = {
  scope: "COMMISSARY" | "BRANCH";
  branchOptions: InventoryBranchOption[];
  selectedBranchId?: string;
  search: string;
  statusFilter?: "active" | "inactive";
  categoryFilter?: string;
  availableCategories: string[];
  canViewCommissary: boolean;
  canViewBranch: boolean;
  branchName: string;
  page: number;
  onPendingChange: (pending: boolean) => void;
};
