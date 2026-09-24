import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import seed from "./fixtures/operational-api.json";
import { authMeResponseSchema } from "@/features/auth/schemas/auth.schema";
import {
  permissionsResponseSchema,
  rolesResponseSchema,
} from "@/features/roles/schemas/role.schema";

const require = createRequire(import.meta.url);
const { createOperationalApiFixture } =
  require("./operational-api-fixture.cjs") as {
    createOperationalApiFixture: (options: {
      gatewaySecret: string;
    }) => Promise<{
      baseUrl: string;
      close: () => Promise<void>;
    }>;
  };

const gatewaySecret = "a".repeat(64);

describe("operational API fixture", () => {
  it("keeps its seeded auth, roles, and permission catalog within app schemas", () => {
    const user = authMeResponseSchema.parse({
      user: seed.user,
      role: seed.user.role,
      permissions: seed.user.permissions,
      branch_ids: seed.user.branch_ids,
    });

    expect(user.user.email).toBe("ops-admin@example.test");
    expect(rolesResponseSchema.parse(seed.roles)).toHaveLength(3);
    expect(permissionsResponseSchema.parse(seed.permissions)).toHaveLength(59);
  });

  it("serves only gateway-authenticated role data and supports deactivation", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const rejected = await fetch(`${fixture.baseUrl}/roles`);
      expect(rejected.status).toBe(401);

      const login = await fetch(`${fixture.baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-coms-auth-gateway": gatewaySecret,
        },
        body: JSON.stringify(seed.login),
      });
      expect(login.status).toBe(200);
      const cookie = login.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");

      const roles = await fetch(`${fixture.baseUrl}/roles`, {
        headers: { cookie, "x-coms-auth-gateway": gatewaySecret },
      });
      expect(rolesResponseSchema.parse(await roles.json())).toHaveLength(3);

      const deactivate = await fetch(`${fixture.baseUrl}/roles/3/deactivate`, {
        method: "POST",
        headers: { cookie, "x-coms-auth-gateway": gatewaySecret },
      });
      expect(deactivate.status).toBe(204);

      const state = await fetch(`${fixture.baseUrl}/__fixture/state`);
      const value = (await state.json()) as {
        roles: Array<{ id: string; is_active: boolean }>;
      };
      expect(value.roles.find((role) => role.id === "3")?.is_active).toBe(
        false,
      );
    } finally {
      await fixture.close();
    }
  });
});
