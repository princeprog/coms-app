import type { z } from "zod";
import type {
  createStaffSchema,
  staffSchema,
  staffPageSchema,
} from "@/features/staff/schemas/staff.schema";

export type StaffMember = z.infer<typeof staffSchema>;
export type StaffPage = z.infer<typeof staffPageSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type StaffMutationResult = { ok: true } | { ok: false; error: string };
export type StaffBranchOption = { id: string; name: string };
export type StaffManagementPermissions = {
  canUpdate: boolean;
  canAssignRole: boolean;
  canAssignBranches: boolean;
  canDeactivate: boolean;
  canReadRoles: boolean;
  canReadBranches: boolean;
};
