"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import {
  createBranchSchema,
  updateBranchSchema,
} from "@/features/branches/schemas/branch.schema";
import type { BranchMutationResult } from "@/features/branches/types/branch.types";

const BRANCH_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getActionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission for this branch.";
    return error.message;
  }
  return "COMS could not complete this change. Try again.";
}

async function mutateBranch(
  method: "POST" | "PATCH",
  endpoint: string,
  body?: unknown,
): Promise<BranchMutationResult> {
  try {
    await requestComsApi<unknown>(endpoint, {
      cookieHeader: (await cookies()).toString(),
      method,
      body,
    });
    revalidatePath("/branches");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function createBranchAction(
  input: unknown,
): Promise<BranchMutationResult> {
  const parsed = createBranchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the branch details." };
  return mutateBranch("POST", "/branches", parsed.data);
}

export async function updateBranchAction(
  id: string,
  input: unknown,
): Promise<BranchMutationResult> {
  const parsed = updateBranchSchema.safeParse(input);
  if (!BRANCH_ID_PATTERN.test(id) || !parsed.success) {
    return { ok: false, error: "Check the branch details." };
  }
  return mutateBranch("PATCH", `/branches/${id}`, parsed.data);
}

export async function deactivateBranchAction(
  id: string,
): Promise<BranchMutationResult> {
  if (!BRANCH_ID_PATTERN.test(id)) {
    return { ok: false, error: "Check the selected branch." };
  }
  return mutateBranch("POST", `/branches/${id}/deactivate`);
}
