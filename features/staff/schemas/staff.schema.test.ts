import { describe, expect, it } from "vitest";
import {
  assignStaffBranchesSchema,
  assignStaffRoleSchema,
  createStaffSchema,
  staffPageSchema,
  updateStaffSchema,
} from "@/features/staff/schemas/staff.schema";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const otherBranchId = "28af8c76-1e33-4745-a03c-7f7fa2db640a";
const staffId = "4b450453-7640-4719-990c-29e97b77e3e9";

describe("staff schemas", () => {
  it("normalizes the API role ID and validates branch-linked staff records", () => {
    const result = staffPageSchema.safeParse({
      items: [
        {
          id: staffId,
          email: "alex@example.com",
          full_name: "Alex Staff",
          contact_number: "09170000000",
          is_active: true,
          role_id: 4,
          role_code: "BRANCH_MANAGER",
          role_name: "Branch Manager",
          branch_ids: [branchId],
        },
      ],
      total: 1,
      page: 1,
      page_size: 25,
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.items[0].role_id).toBe("4");
  });

  it("validates staff creation and rejects duplicate or malformed branches", () => {
    const valid = {
      email: "alex@example.com",
      full_name: "Alex Staff",
      contact_number: "09170000000",
      password: "a secure test password",
      role_id: "4",
      branch_ids: [branchId],
    };

    expect(createStaffSchema.safeParse(valid).success).toBe(true);
    expect(
      createStaffSchema.safeParse({ ...valid, password: "short" }).success,
    ).toBe(false);
    expect(
      createStaffSchema.safeParse({
        ...valid,
        branch_ids: [branchId, branchId],
      }).success,
    ).toBe(false);
  });

  it("validates each staff mutation and rejects unknown fields", () => {
    expect(
      updateStaffSchema.safeParse({ full_name: "Alex Staff" }).success,
    ).toBe(true);
    expect(updateStaffSchema.safeParse({ full_name: "A" }).success).toBe(false);
    expect(assignStaffRoleSchema.safeParse({ role_id: 4 }).success).toBe(true);
    expect(
      assignStaffBranchesSchema.safeParse({ branch_ids: [branchId] }).success,
    ).toBe(true);
    expect(
      assignStaffBranchesSchema.safeParse({
        branch_ids: [branchId, otherBranchId],
        admin: true,
      }).success,
    ).toBe(false);
  });
});
