"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { staffEndpoints } from "@/features/staff/constants";
import {
  assignStaffBranchesSchema,
  assignStaffRoleSchema,
  createStaffSchema,
  updateStaffSchema,
} from "@/features/staff/schemas/staff.schema";
import type { StaffMutationResult } from "@/features/staff/types/staff.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getActionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission or access to this branch.";
    if (error.status === 404)
      return "This staff account is no longer available in the selected branch.";
    return error.message;
  }
  return "COMS could not complete this change. Try again.";
}

async function mutateStaff(
  method: "POST" | "PATCH" | "PUT",
  endpoint: string,
  body?: unknown,
): Promise<StaffMutationResult> {
  try {
    await requestComsApi<unknown>(endpoint, {
      cookieHeader: (await cookies()).toString(),
      method,
      body,
    });
    revalidatePath("/staff");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

function isValidTarget(id: string, branchId: string | undefined): boolean {
  return (
    UUID_PATTERN.test(id) &&
    (branchId === undefined || UUID_PATTERN.test(branchId))
  );
}

function scopedEndpoint(path: string, branchId: string | undefined): string {
  if (branchId === undefined) return path;
  const query = new URLSearchParams({ branch_id: branchId });
  return `${path}?${query}`;
}

export async function createStaffAction(
  input: unknown,
): Promise<StaffMutationResult> {
  const parsed = createStaffSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the staff details." };
  return mutateStaff("POST", staffEndpoints.collection, parsed.data);
}

export async function updateStaffAction(
  id: string,
  branchId: string | undefined,
  input: unknown,
): Promise<StaffMutationResult> {
  const parsed = updateStaffSchema.safeParse(input);
  if (!isValidTarget(id, branchId) || !parsed.success) {
    return { ok: false, error: "Check the staff details." };
  }
  return mutateStaff(
    "PATCH",
    scopedEndpoint(staffEndpoints.member(id), branchId),
    parsed.data,
  );
}

export async function assignStaffRoleAction(
  id: string,
  branchId: string | undefined,
  input: unknown,
): Promise<StaffMutationResult> {
  const parsed = assignStaffRoleSchema.safeParse(input);
  if (!isValidTarget(id, branchId) || !parsed.success) {
    return { ok: false, error: "Check the selected staff role." };
  }
  return mutateStaff(
    "PUT",
    scopedEndpoint(staffEndpoints.role(id), branchId),
    parsed.data,
  );
}

export async function assignStaffBranchesAction(
  id: string,
  branchId: string | undefined,
  input: unknown,
): Promise<StaffMutationResult> {
  const parsed = assignStaffBranchesSchema.safeParse(input);
  if (!isValidTarget(id, branchId) || !parsed.success) {
    return { ok: false, error: "Check the selected branch assignments." };
  }
  return mutateStaff(
    "PUT",
    scopedEndpoint(staffEndpoints.branches(id), branchId),
    parsed.data,
  );
}

export async function deactivateStaffAction(
  id: string,
  branchId: string | undefined,
): Promise<StaffMutationResult> {
  if (!isValidTarget(id, branchId)) {
    return { ok: false, error: "Check the selected staff account." };
  }
  return mutateStaff(
    "POST",
    scopedEndpoint(staffEndpoints.deactivate(id), branchId),
  );
}
