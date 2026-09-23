"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import {
  createRoleSchema,
  replaceRolePermissionsSchema,
  updateRoleNameSchema,
} from "@/features/roles/schemas/role.schema";
import type { RoleMutationResult } from "@/features/roles/types/role.types";

function getActionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403) return "You do not have permission to do this.";
    return error.message;
  }
  return "COMS could not complete this change. Try again.";
}

async function mutateRole(
  method: "POST" | "PATCH" | "PUT",
  endpoint: string,
  body?: unknown,
): Promise<RoleMutationResult> {
  try {
    await requestComsApi<unknown>(endpoint, {
      cookieHeader: (await cookies()).toString(),
      method,
      body,
    });
    revalidatePath("/roles");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function createRoleAction(
  input: unknown,
): Promise<RoleMutationResult> {
  const parsed = createRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the role details." };
  return mutateRole("POST", "/roles", parsed.data);
}

export async function updateRoleNameAction(
  id: string,
  input: unknown,
): Promise<RoleMutationResult> {
  const parsed = updateRoleNameSchema.safeParse(input);
  if (!/^[1-9]\d{0,18}$/.test(id) || !parsed.success) {
    return { ok: false, error: "Check the role details." };
  }
  return mutateRole("PATCH", `/roles/${id}`, parsed.data);
}

export async function replaceRolePermissionsAction(
  id: string,
  input: unknown,
): Promise<RoleMutationResult> {
  const parsed = replaceRolePermissionsSchema.safeParse(input);
  if (!/^[1-9]\d{0,18}$/.test(id) || !parsed.success) {
    return { ok: false, error: "Check the role permissions." };
  }
  return mutateRole("PUT", `/roles/${id}/permissions`, parsed.data);
}

export async function deactivateRoleAction(
  id: string,
): Promise<RoleMutationResult> {
  if (!/^[1-9]\d{0,18}$/.test(id)) {
    return { ok: false, error: "Check the selected role." };
  }
  return mutateRole("POST", `/roles/${id}/deactivate`);
}
