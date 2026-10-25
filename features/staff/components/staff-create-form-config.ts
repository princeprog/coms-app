import type { StaffCreateValues } from "@/features/staff/components/staff-create-fields";
import type { StaffCreateField } from "@/features/staff/components/staff-create-validation";
import { UNASSIGNED_ROLE_VALUE } from "@/features/staff/constants";

export const initialStaffCreateValues: StaffCreateValues = {
  fullName: "",
  email: "",
  contactNumber: "",
};

export const staffCreateFieldOrder: StaffCreateField[] = [
  "fullName",
  "email",
  "contactNumber",
];

export const staffCreateFieldIds: Record<StaffCreateField, string> = {
  fullName: "staff-create-full-name",
  email: "staff-create-email",
  contactNumber: "staff-create-contact",
};

export function isStaffCreateDirty(
  values: StaffCreateValues,
  roleId: string,
  branchIds: string[],
  initialBranchIds: string[],
) {
  return Boolean(
    values.fullName ||
    values.email ||
    values.contactNumber ||
    roleId !== UNASSIGNED_ROLE_VALUE ||
    branchIds.length !== initialBranchIds.length ||
    branchIds.some((id) => !initialBranchIds.includes(id)),
  );
}
