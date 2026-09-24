import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import seed from "./fixtures/operational-api.json";
import { authMeResponseSchema } from "@/features/auth/schemas/auth.schema";
import { branchesResponseSchema } from "@/features/branches/schemas/branch.schema";
import { staffPageSchema } from "@/features/staff/schemas/staff.schema";
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

  it("serves schema-valid, paginated branch records for the operations directory", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const login = await fetch(`${fixture.baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-coms-auth-gateway": gatewaySecret,
        },
        body: JSON.stringify(seed.login),
      });
      const cookie = login.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      const headers = { cookie, "x-coms-auth-gateway": gatewaySecret };

      const firstPage = await fetch(
        `${fixture.baseUrl}/branches?page=1&page_size=25`,
        { headers },
      );
      expect(firstPage.status).toBe(200);
      const first = branchesResponseSchema.parse(await firstPage.json());
      expect(first.items).toHaveLength(25);
      expect(first.total).toBe(26);
      expect(first.items.some((branch) => branch.status === "inactive")).toBe(
        true,
      );
      expect(first.items.some((branch) => branch.branch_name.length > 80)).toBe(
        true,
      );

      const secondPage = await fetch(
        `${fixture.baseUrl}/branches?page=2&page_size=25`,
        { headers },
      );
      const second = branchesResponseSchema.parse(await secondPage.json());
      expect(second.items).toHaveLength(1);
      expect(second.page).toBe(2);

      const firstBranch = first.items[0];
      const failedOnce = await fetch(`${fixture.baseUrl}/__fixture/fail-next`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          path: "/branches",
          status: 503,
          message: "Fixture branch service unavailable.",
        }),
      });
      expect(failedOnce.status).toBe(204);

      const rejectedCreate = await fetch(`${fixture.baseUrl}/branches`, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({
          code: "RETRY_BRANCH",
          branch_name: "Retry branch",
          address: null,
          date_opened: null,
          has_dine_in: false,
        }),
      });
      expect(rejectedCreate.status).toBe(503);

      const retriedCreate = await fetch(`${fixture.baseUrl}/branches`, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({
          code: "RETRY_BRANCH",
          branch_name: "Retry branch",
          address: null,
          date_opened: null,
          has_dine_in: false,
        }),
      });
      expect(retriedCreate.status).toBe(201);

      const update = await fetch(
        `${fixture.baseUrl}/branches/${firstBranch.id}`,
        {
          method: "PATCH",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({
            branch_name: "Updated fixture branch",
            address: "Updated address",
            date_opened: "2024-05-01",
            has_dine_in: true,
          }),
        },
      );
      expect(update.status).toBe(204);

      const deactivate = await fetch(
        `${fixture.baseUrl}/branches/${firstBranch.id}/deactivate`,
        { method: "POST", headers },
      );
      expect(deactivate.status).toBe(204);

      const afterMutations = await fetch(
        `${fixture.baseUrl}/branches?page=1&page_size=25`,
        { headers },
      );
      const updatedPage = branchesResponseSchema.parse(
        await afterMutations.json(),
      );
      expect(updatedPage.total).toBe(27);
      expect(updatedPage.items[0]).toMatchObject({
        branch_name: "Updated fixture branch",
        status: "inactive",
      });
    } finally {
      await fixture.close();
    }
  });

  it("serves schema-valid, branch-scoped staff records for the staff directory", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const login = await fetch(`${fixture.baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-coms-auth-gateway": gatewaySecret,
        },
        body: JSON.stringify(seed.login),
      });
      const cookie = login.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      const headers = { cookie, "x-coms-auth-gateway": gatewaySecret };
      const branchId = "10000000-0000-4000-8000-000000000001";

      const firstResponse = await fetch(
        `${fixture.baseUrl}/staff?page=1&page_size=25&branch_id=${branchId}`,
        { headers },
      );
      expect(firstResponse.status).toBe(200);
      const first = staffPageSchema.parse(await firstResponse.json());
      expect(first.items).toHaveLength(25);
      expect(first.total).toBe(26);
      expect(first.items.some((member) => !member.is_active)).toBe(true);
      expect(first.items.some((member) => member.full_name.length > 80)).toBe(
        true,
      );
      expect(
        first.items.every((member) => member.branch_ids.includes(branchId)),
      ).toBe(true);

      const secondResponse = await fetch(
        `${fixture.baseUrl}/staff?page=2&page_size=25&branch_id=${branchId}`,
        { headers },
      );
      const second = staffPageSchema.parse(await secondResponse.json());
      expect(second.items).toHaveLength(1);
      expect(second.page).toBe(2);
    } finally {
      await fixture.close();
    }
  });

  it("supports staff creation, independent updates, deactivation, and retry responses", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const login = await fetch(`${fixture.baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-coms-auth-gateway": gatewaySecret,
        },
        body: JSON.stringify(seed.login),
      });
      const cookie = login.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      const headers = { cookie, "x-coms-auth-gateway": gatewaySecret };
      const branchId = "10000000-0000-4000-8000-000000000001";
      const createBody = {
        email: "new.staff@example.test",
        full_name: "New Fixture Staff",
        contact_number: "09171234567",
        password: "fixture-only-long-password",
        role_id: "1",
        branch_ids: [branchId],
      };

      await fetch(`${fixture.baseUrl}/__fixture/fail-next`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          path: "/staff",
          status: 503,
          message: "Fixture staff service unavailable.",
        }),
      });
      const failedCreate = await fetch(`${fixture.baseUrl}/staff`, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify(createBody),
      });
      expect(failedCreate.status).toBe(503);

      const create = await fetch(`${fixture.baseUrl}/staff`, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify(createBody),
      });
      expect(create.status).toBe(201);
      const created = (await create.json()) as { id: string };
      const scope = `?branch_id=${branchId}`;

      const profile = await fetch(
        `${fixture.baseUrl}/staff/${created.id}${scope}`,
        {
          method: "PATCH",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({ full_name: "Fixture Staff Updated" }),
        },
      );
      expect(profile.status).toBe(204);

      const role = await fetch(
        `${fixture.baseUrl}/staff/${created.id}/role${scope}`,
        {
          method: "PUT",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({ role_id: "3" }),
        },
      );
      expect(role.status).toBe(204);

      const assignment = await fetch(
        `${fixture.baseUrl}/staff/${created.id}/branches${scope}`,
        {
          method: "PUT",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({
            branch_ids: [branchId, "10000000-0000-4000-8000-000000000002"],
          }),
        },
      );
      expect(assignment.status).toBe(204);

      const deactivate = await fetch(
        `${fixture.baseUrl}/staff/${created.id}/deactivate${scope}`,
        { method: "POST", headers },
      );
      expect(deactivate.status).toBe(204);

      const response = await fetch(
        `${fixture.baseUrl}/staff?page=1&page_size=100&branch_id=${branchId}`,
        { headers },
      );
      const page = staffPageSchema.parse(await response.json());
      expect(page.total).toBe(27);
      expect(
        page.items.find((member) => member.id === created.id),
      ).toMatchObject({
        full_name: "Fixture Staff Updated",
        role_code: "STOCK_MANAGER",
        branch_ids: [branchId, "10000000-0000-4000-8000-000000000002"],
        is_active: false,
      });
    } finally {
      await fixture.close();
    }
  });
});
