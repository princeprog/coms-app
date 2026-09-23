import type { z } from "zod";
import type { branchSchema } from "@/features/branches/schemas/branch.schema";

export type Branch = z.infer<typeof branchSchema>;
export type BranchMutationResult = { ok: true } | { ok: false; error: string };
export type BranchPage = {
  items: Branch[];
  total: number;
  page: number;
  page_size: number;
};
