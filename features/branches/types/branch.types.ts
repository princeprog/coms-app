import type { z } from "zod";
import type { branchSchema } from "@/features/branches/schemas/branch.schema";

export type Branch = z.infer<typeof branchSchema>;
export type BranchMutationResult = { ok: true } | { ok: false; error: string };
export type BranchCreateResult =
  { ok: true; code: string } | { ok: false; error: string };
export type BranchPage = {
  items: Branch[];
  total: number;
  page: number;
  page_size: number;
};

export type BranchDirectoryFilters = {
  page: number;
  search: string;
  status: "" | "active" | "inactive";
  service_type: "" | "DINE_IN" | "TAKEAWAY";
  sort: "name_asc" | "name_desc" | "opened_desc" | "opened_asc";
};
export type BranchAccess = Record<
  string,
  { canUpdate: boolean; canDeactivate: boolean }
>;
