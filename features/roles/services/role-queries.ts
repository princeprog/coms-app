import "server-only";

import { cookies } from "next/headers";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import {
  permissionsResponseSchema,
  rolesResponseSchema,
} from "@/features/roles/schemas/role.schema";

export async function getRoleAdminData() {
  const cookieHeader = (await cookies()).toString();
  const [rolesPayload, permissionsPayload] = await Promise.all([
    requestComsApi<unknown>("/roles", { cookieHeader }),
    requestComsApi<unknown>("/roles/permissions", { cookieHeader }),
  ]);
  const roles = rolesResponseSchema.safeParse(rolesPayload);
  const permissions = permissionsResponseSchema.safeParse(permissionsPayload);
  if (!roles.success || !permissions.success) {
    throw new ApiRequestError("Invalid role administration response.", 502);
  }
  return { roles: roles.data, permissions: permissions.data };
}
