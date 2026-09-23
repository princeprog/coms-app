import "server-only";

import { cookies } from "next/headers";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import { branchesResponseSchema } from "@/features/branches/schemas/branch.schema";

export async function getBranchPageData(page: number) {
  const cookieHeader = (await cookies()).toString();
  const payload = await requestComsApi<unknown>(
    `/branches?page=${page}&page_size=25`,
    { cookieHeader },
  );
  const parsed = branchesResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiRequestError("Invalid branch administration response.", 502);
  }
  return parsed.data;
}
