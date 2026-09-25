import "server-only";

import { cookies } from "next/headers";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import {
  permissionsResponseSchema,
  rolesResponseSchema,
} from "@/features/roles/schemas/role.schema";

export async function getRoles() {
  const cookieHeader = (await cookies()).toString();
  const rolesPayload = await requestComsApi<unknown>("/roles", {
    cookieHeader,
  });
  const roles = rolesResponseSchema.safeParse(rolesPayload);
  if (!roles.success) {
    throw new ApiRequestError("Invalid role administration response.", 502);
  }
  return roles.data;
}

export async function getRolePermissions() {
  const cookieHeader = (await cookies()).toString();
  const permissionsPayload = await requestComsApi<unknown>(
    "/roles/permissions",
    { cookieHeader },
  );
  const permissions = permissionsResponseSchema.safeParse(permissionsPayload);
  if (!permissions.success) {
    throw new ApiRequestError("Invalid role administration response.", 502);
  }
  return permissions.data;
}

export async function getRoleAdminData() {
  const [roles, permissions] = await Promise.all([
    getRoles(),
    getRolePermissions(),
  ]);
  return { roles, permissions };
}
