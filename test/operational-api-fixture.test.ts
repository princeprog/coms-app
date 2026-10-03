import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import seed from "./fixtures/operational-api.json";
import { authMeResponseSchema } from "@/features/auth/schemas/auth.schema";
import {
  branchSchema,
  branchesResponseSchema,
} from "@/features/branches/schemas/branch.schema";
import { staffPageSchema } from "@/features/staff/schemas/staff.schema";
import { stockItemPageSchema } from "@/features/stock-items/schemas/stock-item.schema";
import { supplierPageSchema } from "@/features/suppliers/schemas/supplier.schema";
import {
  dispatchDetailSchema,
  dispatchPageSchema,
} from "@/features/dispatches/schemas/dispatch.schema";
import {
  supplierReceiptDetailSchema,
  supplierReceiptPageSchema,
} from "@/features/supplier-receipts/schemas/supplier-receipt.schema";
import {
  permissionsResponseSchema,
  rolesResponseSchema,
} from "@/features/roles/schemas/role.schema";
import {
  productPageSchema,
  productSchema,
} from "@/features/products/schemas/product.schema";
import { recipeResponseSchema } from "@/features/recipes/schemas/recipe.schema";
import {
  branchProductPageSchema,
  branchProductSchema,
} from "@/features/branch-products/schemas/branch-product.schema";
import {
  saleDetailSchema,
  salePageSchema,
} from "@/features/sales/schemas/sale.schema";
import {
  dailyReportDetailSchema,
  dailyReportPageSchema,
} from "@/features/daily-reports/schemas/daily-report.schema";
import {
  inventoryMovementPageSchema,
  inventoryPageSchema,
} from "@/features/inventory/schemas/inventory.schema";
import { dashboardResponseSchema } from "@/features/dashboard/schemas/dashboard.schema";

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

describe("reviewed dispatch fixture", () => {
  it("sends atomically, retries without another deduction, and leaves no record after failure", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const headers = {
        ...(await getAuthenticatedHeaders(fixture.baseUrl)),
        "content-type": "application/json",
      };
      const stock = await fetch(
        fixture.baseUrl + "/stock-items?page=1&page_size=25&is_active=true",
        { headers },
      ).then((r) => r.json());
      const branch = await fetch(fixture.baseUrl + "/branches", {
        headers,
      }).then((r) => r.json());
      const payload = {
        branch_id: branch.items[0].id,
        items: [
          { stock_item_id: stock.items[0].id, quantity_dispatched: "2.5" },
        ],
      };
      const key = "92000000-0000-4000-8000-000000000001";
      const send = () =>
        fetch(fixture.baseUrl + "/dispatches/send", {
          method: "POST",
          headers: { ...headers, "Idempotency-Key": key },
          body: JSON.stringify(payload),
        });
      const response = await send();
      expect(response.status).toBe(201);
      const dispatched = dispatchDetailSchema.parse(await response.json());
      expect(dispatched.status).toBe("IN_TRANSIT");
      expect(dispatched.events).toHaveLength(1);
      const after = await fetch(fixture.baseUrl + "/__fixture/state").then(
        (r) => r.json(),
      );
      expect(dispatchDetailSchema.parse(await (await send()).json()).id).toBe(
        dispatched.id,
      );
      const replayed = await fetch(fixture.baseUrl + "/__fixture/state").then(
        (r) => r.json(),
      );
      expect(replayed.commissaryBalances).toEqual(after.commissaryBalances);
      expect(replayed.commissaryMovements).toHaveLength(
        after.commissaryMovements.length,
      );
      const failed = await fetch(fixture.baseUrl + "/dispatches/send", {
        method: "POST",
        headers: {
          ...headers,
          "Idempotency-Key": "92000000-0000-4000-8000-000000000002",
        },
        body: JSON.stringify({
          ...payload,
          items: [
            { stock_item_id: stock.items[0].id, quantity_dispatched: "999999" },
          ],
        }),
      });
      expect(failed.status).toBe(400);
      const rolledBack = await fetch(fixture.baseUrl + "/__fixture/state").then(
        (r) => r.json(),
      );
      expect(rolledBack.dispatches).toHaveLength(after.dispatches.length);
      expect(rolledBack.commissaryBalances).toEqual(after.commissaryBalances);
    } finally {
      await fixture.close();
    }
  });
});

async function getAuthenticatedHeaders(baseUrl: string) {
  const login = await fetch(baseUrl + "/auth/login", {
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
  return { cookie, "x-coms-auth-gateway": gatewaySecret };
}

function fixtureProductId(index: number) {
  return `35000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
}

function fixtureReportId(index: number) {
  return `69000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
}

describe("operational API fixture", () => {
  it("keeps its seeded auth, roles, and permission catalog within app schemas", () => {
    const user = authMeResponseSchema.parse({
      user: seed.user,
      role: seed.user.role,
      permissions: seed.user.permissions,
      branch_ids: seed.user.branch_ids,
    });

    expect(user.user.email).toBe("ops-admin@example.test");
    const roles = rolesResponseSchema.parse(seed.roles);
    expect(roles).toHaveLength(5);
    expect(
      roles.filter((role) => role.is_predefined).map((role) => role.code),
    ).toEqual(["COMMISSARY_MANAGER", "BRANCH_MANAGER", "CASHIER"]);
    const permissionCatalog = permissionsResponseSchema.parse(seed.permissions);
    expect(permissionCatalog).toHaveLength(58);
    expect(permissionCatalog.map((permission) => permission.key)).not.toContain(
      "supplier_receipts.post",
    );
    expect(
      permissionCatalog.some((permission) =>
        permission.key.startsWith("stock_requests."),
      ),
    ).toBe(false);
    const commissaryManager = roles.find(
      (role) => role.code === "COMMISSARY_MANAGER",
    );
    const branchManager = roles.find((role) => role.code === "BRANCH_MANAGER");
    const cashier = roles.find((role) => role.code === "CASHIER");
    expect(commissaryManager?.permission_keys).toContain("dispatches.reconcile");
    expect(branchManager?.permission_keys).toContain("dashboard.read");
    expect(
      roles.every((role) => !role.permission_keys.includes("dashboard.global_read")),
    ).toBe(true);
    expect(cashier?.permission_keys).not.toContain("dashboard.read");
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
      const roleRecords = rolesResponseSchema.parse(await roles.json());
      expect(roleRecords).toHaveLength(5);
      expect(
        roleRecords.find((role) => role.code === "BRANCH_MANAGER")
          ?.is_predefined,
      ).toBe(true);

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
          branch_name: "Retry branch",
          address: null,
          date_opened: null,
          has_dine_in: false,
        }),
      });
      expect(retriedCreate.status).toBe(201);
      expect(branchSchema.parse(await retriedCreate.json()).code).toMatch(
        /^BR-[A-F0-9]{16}$/,
      );
      const createdPage = await fetch(
        `${fixture.baseUrl}/branches?page=2&page_size=25`,
        { headers },
      );
      const createdBranches = branchesResponseSchema.parse(
        await createdPage.json(),
      );
      expect(
        createdBranches.items.find(
          (branch) => branch.branch_name === "Retry branch",
        )?.code,
      ).toMatch(/^BR-[A-F0-9]{16}$/);

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
        role_id: null,
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

  it("serves receipt catalogs and supports retried creation, posting, and detail reads", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const login = await fetch(fixture.baseUrl + "/auth/login", {
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

      const suppliers = await fetch(
        fixture.baseUrl + "/suppliers?page=1&page_size=100&is_active=true",
        { headers },
      );
      const supplierPage = supplierPageSchema.parse(await suppliers.json());
      expect(supplierPage.items).toHaveLength(25);
      expect(
        supplierPage.items.some((item) => item.supplier_name.length > 60),
      ).toBe(true);

      const stockItems = await fetch(
        fixture.baseUrl + "/stock-items?page=1&page_size=100&is_active=true",
        { headers },
      );
      const stockItemPage = stockItemPageSchema.parse(await stockItems.json());
      expect(stockItemPage.items).toHaveLength(25);

      const firstResponse = await fetch(
        fixture.baseUrl + "/supplier-receipts?page=1&page_size=25",
        { headers },
      );
      const first = supplierReceiptPageSchema.parse(await firstResponse.json());
      expect(first.items).toHaveLength(25);
      expect(first.total).toBe(26);
      expect(first.items.every((item) => item.recorded_at)).toBe(true);
      expect(first.items.some((item) => item.supplier_name.length > 60)).toBe(
        true,
      );

      const secondResponse = await fetch(
        fixture.baseUrl + "/supplier-receipts?page=2&page_size=25",
        { headers },
      );
      expect(
        supplierReceiptPageSchema.parse(await secondResponse.json()).items,
      ).toHaveLength(1);

      const filteredResponse = await fetch(
        fixture.baseUrl + "/supplier-receipts?search=North+Farm",
        { headers },
      );
      const filtered = supplierReceiptPageSchema.parse(
        await filteredResponse.json(),
      );
      expect(filtered.items).toHaveLength(1);
      expect(filtered.items[0].supplier_name).toBe("North Farm Supply");

      const supplier = supplierPage.items[0];
      const stockItem = stockItemPage.items[0];
      const initialStateResponse = await fetch(
        fixture.baseUrl + "/__fixture/state",
      );
      const initialState = (await initialStateResponse.json()) as {
        commissaryBalances: Array<{ id: string; quantity_on_hand: string }>;
        commissaryMovements: Array<{ stock_item_id: string }>;
      };
      const initialQuantity = initialState.commissaryBalances.find(
        (balance) => balance.id === stockItem.id,
      )!.quantity_on_hand;
      const initialMovementCount = initialState.commissaryMovements.filter(
        (movement) => movement.stock_item_id === stockItem.id,
      ).length;
      const idempotencyKey = "60000000-0000-4000-8000-000000000001";
      const createBody = {
        supplier_id: supplier.id,
        received_at: "2026-09-25",
        items: [
          {
            stock_item_id: stockItem.id,
            quantity_received: "1.25",
            unit_cost: "2.50",
          },
        ],
      };
      await fetch(fixture.baseUrl + "/__fixture/fail-next", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          path: "/supplier-receipts",
          status: 503,
          message: "Fixture receipt service unavailable.",
        }),
      });
      const failed = await fetch(fixture.baseUrl + "/supplier-receipts", {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(createBody),
      });
      expect(failed.status).toBe(503);

      const createdResponse = await fetch(
        fixture.baseUrl + "/supplier-receipts",
        {
          method: "POST",
          headers: {
            ...headers,
            "content-type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(createBody),
        },
      );
      expect(createdResponse.status).toBe(201);
      const created = supplierReceiptDetailSchema.parse(
        await createdResponse.json(),
      );
      expect(created).toMatchObject({
        total_cost: "3.125",
        recorded_by_user_id: seed.user.id,
        recorded_by_name: "Fixture Operations Lead",
        items: [{ quantity_received: "1.25", unit_cost: "2.50" }],
      });

      const retryResponse = await fetch(
        fixture.baseUrl + "/supplier-receipts",
        {
          method: "POST",
          headers: {
            ...headers,
            "content-type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(createBody),
        },
      );
      expect(
        supplierReceiptDetailSchema.parse(await retryResponse.json()).id,
      ).toBe(created.id);
      const conflictingRetry = await fetch(
        fixture.baseUrl + "/supplier-receipts",
        {
          method: "POST",
          headers: {
            ...headers,
            "content-type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            ...createBody,
            items: [{ ...createBody.items[0], quantity_received: "2" }],
          }),
        },
      );
      expect(conflictingRetry.status).toBe(409);

      const postResponse = await fetch(
        fixture.baseUrl + "/supplier-receipts/" + created.id + "/post",
        { method: "POST", headers },
      );
      expect(postResponse.status).toBe(404);

      const detailResponse = await fetch(
        fixture.baseUrl + "/supplier-receipts/" + created.id,
        { headers },
      );
      expect(
        supplierReceiptDetailSchema.parse(await detailResponse.json()),
      ).toMatchObject({ id: created.id, recorded_at: created.recorded_at });

      const stateResponse = await fetch(fixture.baseUrl + "/__fixture/state");
      const state = (await stateResponse.json()) as {
        receipts: Array<{ id: string }>;
        commissaryBalances: Array<{ id: string; quantity_on_hand: string }>;
        commissaryMovements: Array<{ stock_item_id: string }>;
      };
      expect(state.receipts).toHaveLength(27);
      expect(
        state.commissaryBalances.find((balance) => balance.id === stockItem.id)
          ?.quantity_on_hand,
      ).toBe("21.5");
      expect(
        state.commissaryMovements.filter(
          (movement) => movement.stock_item_id === stockItem.id,
        ),
      ).toHaveLength(initialMovementCount + 1);
      expect(initialQuantity).toBe("20.25");
    } finally {
      await fixture.close();
    }
  });

  it("retires active stock request endpoints while retaining legacy dispatch history", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const headers = await getAuthenticatedHeaders(fixture.baseUrl);
      for (const path of [
        "/stock-requests",
        "/stock-requests/33000000-0000-4000-8000-000000000001",
        "/stock-requests/33000000-0000-4000-8000-000000000001/approve",
      ]) {
        const response = await fetch(fixture.baseUrl + path, {
          headers,
          method: path.endsWith("/approve") ? "POST" : "GET",
        });
        expect(response.status).toBe(404);
      }
      const state = await fetch(fixture.baseUrl + "/__fixture/state").then((response) => response.json());
      expect(state).not.toHaveProperty("stockRequests");
      expect(state.dispatches.length).toBeGreaterThan(0);
      expect(state.dispatches.every((dispatch: Record<string, unknown>) => !("stock_request_id" in dispatch))).toBe(true);
    } finally {
      await fixture.close();
    }
  });

  it("serves paginated dispatches with each workflow state and linked history", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const login = await fetch(fixture.baseUrl + "/auth/login", {
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

      const firstResponse = await fetch(
        fixture.baseUrl + "/dispatches?page=1&page_size=25",
        { headers },
      );
      expect(firstResponse.status).toBe(200);
      const firstPage = dispatchPageSchema.parse(await firstResponse.json());
      expect(firstPage).toMatchObject({ total: 26, page: 1, page_size: 25 });
      expect(firstPage.items).toHaveLength(25);
      expect(new Set(firstPage.items.map((item) => item.status)).size).toBe(5);
      const secondResponse = await fetch(
        fixture.baseUrl + "/dispatches?page=2&page_size=25",
        { headers },
      );
      const secondPage = dispatchPageSchema.parse(await secondResponse.json());
      expect(secondPage.items).toHaveLength(1);
      expect(secondPage.page).toBe(2);
      expect(secondPage.items[0].branch_name.length).toBeGreaterThan(80);

      const receivedResponse = await fetch(
        fixture.baseUrl + "/dispatches?status=RECEIVED",
        { headers },
      );
      const receivedPage = dispatchPageSchema.parse(
        await receivedResponse.json(),
      );
      expect(receivedPage.total).toBe(5);
      expect(
        receivedPage.items.every((item) => item.status === "RECEIVED"),
      ).toBe(true);

      const partial = firstPage.items.find(
        (dispatch) => dispatch.status === "PARTIALLY_RECEIVED",
      );
      expect(partial).toBeDefined();
      const partialDetailResponse = await fetch(
        fixture.baseUrl + "/dispatches/" + partial!.id,
        { headers },
      );
      const partialDetail = dispatchDetailSchema.parse(
        await partialDetailResponse.json(),
      );
      expect(
        partialDetail.items.some((item) => item.quantity_in_transit !== "0"),
      ).toBe(true);
      expect(partialDetail.receipts[0]?.items.length).toBeGreaterThan(0);

      const shortage = firstPage.items.find(
        (dispatch) => dispatch.status === "CLOSED_WITH_SHORTAGE",
      );
      expect(shortage).toBeDefined();
      const shortageResponse = await fetch(
        fixture.baseUrl + "/dispatches/" + shortage!.id,
        { headers },
      );
      const shortageDetail = dispatchDetailSchema.parse(
        await shortageResponse.json(),
      );
      expect(shortageDetail.shortage_closures[0]?.reason).toBeTruthy();
      expect(
        shortageDetail.items.every((item) => item.quantity_in_transit === "0"),
      ).toBe(true);
    } finally {
      await fixture.close();
    }
  });

  it("supports dispatch creation retry, posting, partial receipts, and shortage closure", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const login = await fetch(fixture.baseUrl + "/auth/login", {
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

      const stockItemsResponse = await fetch(
        fixture.baseUrl + "/stock-items?page=1&page_size=100&is_active=true",
        { headers },
      );
      const stockItemPage = stockItemPageSchema.parse(await stockItemsResponse.json());
      const stockItem = stockItemPage.items[0];
      const insufficientItem = stockItemPage.items[0];
      const branchId = "10000000-0000-4000-8000-000000000001";
      const initialState = await fetch(fixture.baseUrl + "/__fixture/state").then(
        (response) => response.json(),
      ) as {
        commissaryBalances: Array<{ id: string; quantity_on_hand: string }>;
        commissaryMovements: Array<{ stock_item_id: string; movement_type: string }>;
      };
      const initialQuantity = initialState.commissaryBalances.find(
        (balance) => balance.id === stockItem.id,
      )!.quantity_on_hand;
      const initialMovementCount = initialState.commissaryMovements.filter(
        (movement) => movement.stock_item_id === stockItem.id,
      ).length;

      const createBody = {
        branch_id: branchId,
        items: [{ stock_item_id: stockItem.id, quantity_dispatched: "12.5000" }],
      };
      const createKey = "71000000-0000-4000-8000-000000000001";
      await fetch(fixture.baseUrl + "/__fixture/fail-next", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          path: "/dispatches",
          status: 503,
          message: "Fixture dispatch service unavailable.",
        }),
      });
      const failedCreate = await fetch(fixture.baseUrl + "/dispatches", {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          "Idempotency-Key": createKey,
        },
        body: JSON.stringify(createBody),
      });
      expect(failedCreate.status).toBe(503);

      const createDispatch = () =>
        fetch(fixture.baseUrl + "/dispatches", {
          method: "POST",
          headers: {
            ...headers,
            "content-type": "application/json",
            "Idempotency-Key": createKey,
          },
          body: JSON.stringify(createBody),
        });
      const created = dispatchDetailSchema.parse(
        await (await createDispatch()).json(),
      );
      expect(created).toMatchObject({
        branch_id: branchId,
        status: "DRAFT",
        items: [{ stock_item_id: stockItem.id, quantity_dispatched: "12.5" }],
        events: [{ event_type: "CREATED" }],
      });
      expect(created).not.toHaveProperty("stock_request_id");
      const afterCreate = await fetch(fixture.baseUrl + "/__fixture/state").then(
        (response) => response.json(),
      );
      expect(
        afterCreate.commissaryBalances.find((balance: { id: string }) => balance.id === stockItem.id).quantity_on_hand,
      ).toBe(initialQuantity);
      expect(
        afterCreate.commissaryMovements.filter(
          (movement: { stock_item_id: string }) => movement.stock_item_id === stockItem.id,
        ),
      ).toHaveLength(initialMovementCount);
      expect(
        dispatchDetailSchema.parse(await (await createDispatch()).json()).id,
      ).toBe(created.id);
      const conflictingRetry = await fetch(fixture.baseUrl + "/dispatches", {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          "Idempotency-Key": createKey,
        },
        body: JSON.stringify({
          ...createBody,
          items: [{ stock_item_id: stockItem.id, quantity_dispatched: "3" }],
        }),
      });
      expect(conflictingRetry.status).toBe(409);

      const dispatchKey = "71000000-0000-4000-8000-000000000002";
      const postedResponse = await fetch(
        fixture.baseUrl + "/dispatches/" + created.id + "/dispatch",
        {
          method: "POST",
          headers: { ...headers, "Idempotency-Key": dispatchKey },
        },
      );
      const posted = dispatchDetailSchema.parse(await postedResponse.json());
      expect(posted.status).toBe("IN_TRANSIT");
      const postedState = await fetch(fixture.baseUrl + "/__fixture/state").then(
        (response) => response.json(),
      );
      expect(
        postedState.commissaryBalances.find((balance: { id: string }) => balance.id === stockItem.id).quantity_on_hand,
      ).toBe("7.75");
      expect(
        postedState.commissaryMovements.filter(
          (movement: { stock_item_id: string }) => movement.stock_item_id === stockItem.id,
        ),
      ).toHaveLength(initialMovementCount + 1);
      await fetch(fixture.baseUrl + "/dispatches/" + created.id + "/dispatch", {
        method: "POST",
        headers: { ...headers, "Idempotency-Key": dispatchKey },
      });
      const retriedPostState = await fetch(fixture.baseUrl + "/__fixture/state").then(
        (response) => response.json(),
      );
      expect(
        retriedPostState.commissaryMovements.filter(
          (movement: { stock_item_id: string }) => movement.stock_item_id === stockItem.id,
        ),
      ).toHaveLength(initialMovementCount + 1);

      const insufficientKey = "71000000-0000-4000-8000-000000000008";
      const insufficientCreate = await fetch(fixture.baseUrl + "/dispatches", {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          "Idempotency-Key": "71000000-0000-4000-8000-000000000007",
        },
        body: JSON.stringify({
          branch_id: branchId,
          items: [{ stock_item_id: insufficientItem.id, quantity_dispatched: "99999" }],
        }),
      });
      const insufficientDraft = dispatchDetailSchema.parse(await insufficientCreate.json());
      const insufficientPost = await fetch(
        fixture.baseUrl + "/dispatches/" + insufficientDraft.id + "/dispatch",
        { method: "POST", headers: { ...headers, "Idempotency-Key": insufficientKey } },
      );
      expect(insufficientPost.status).toBe(409);
      const afterInsufficientPost = await fetch(fixture.baseUrl + "/__fixture/state").then(
        (response) => response.json(),
      );
      expect(
        afterInsufficientPost.commissaryBalances.find(
          (balance: { id: string }) => balance.id === insufficientItem.id,
        ).quantity_on_hand,
      ).toBe("7.75");
      expect(
        afterInsufficientPost.commissaryMovements.filter(
          (movement: { stock_item_id: string; movement_type: string }) =>
            movement.stock_item_id === insufficientItem.id &&
            movement.movement_type === "DISPATCH",
        ),
      ).toHaveLength(1);

      const firstItem = posted.items.find(
        (item) => item.quantity_dispatched === "12.5",
      )!;
      const receiveKey = "71000000-0000-4000-8000-000000000003";
      const receiveBody = {
        items: [{ dispatch_item_id: firstItem.id, quantity_received: "2.5" }],
      };
      const receive = () =>
        fetch(fixture.baseUrl + "/dispatches/" + created.id + "/receive", {
          method: "POST",
          headers: {
            ...headers,
            "content-type": "application/json",
            "Idempotency-Key": receiveKey,
          },
          body: JSON.stringify(receiveBody),
        });
      const firstReceipt = dispatchDetailSchema.parse(
        await (await receive()).json(),
      );
      expect(firstReceipt.status).toBe("PARTIALLY_RECEIVED");
      expect(
        dispatchDetailSchema.parse(await (await receive()).json()).receipts,
      ).toHaveLength(1);

      const secondReceipt = await fetch(
        fixture.baseUrl + "/dispatches/" + created.id + "/receive",
        {
          method: "POST",
          headers: {
            ...headers,
            "content-type": "application/json",
            "Idempotency-Key": "71000000-0000-4000-8000-000000000004",
          },
          body: JSON.stringify({
            items: [
              { dispatch_item_id: firstItem.id, quantity_received: "1.5" },
            ],
          }),
        },
      );
      const partiallyReceived = dispatchDetailSchema.parse(
        await secondReceipt.json(),
      );
      expect(partiallyReceived.receipts).toHaveLength(2);
      expect(
        partiallyReceived.items.find((item) => item.id === firstItem.id),
      ).toMatchObject({
        quantity_received: "4",
        quantity_in_transit: "8.5",
      });

      const shortageResponse = await fetch(
        fixture.baseUrl + "/dispatches/" + created.id + "/shortage-closures",
        {
          method: "POST",
          headers: {
            ...headers,
            "content-type": "application/json",
            "Idempotency-Key": "71000000-0000-4000-8000-000000000005",
          },
          body: JSON.stringify({
            reason: "Fixture transport damage.",
            items: [{ dispatch_item_id: firstItem.id, quantity_closed: "1" }],
          }),
        },
      );
      const closed = dispatchDetailSchema.parse(await shortageResponse.json());
      expect(closed.shortage_closures).toHaveLength(1);
      expect(closed.shortage_closures[0]).toMatchObject({
        reason: "Fixture transport damage.",
        items: [{ quantity_closed: "1" }],
      });
      expect(
        closed.items.find((item) => item.id === firstItem.id),
      ).toMatchObject({
        quantity_received: "4",
        quantity_shortage_closed: "1",
        quantity_in_transit: "7.5",
      });
    } finally {
      await fixture.close();
    }
  });

  it("serves schema-valid products, recipes, and branch-offer workflows", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const headers = await getAuthenticatedHeaders(fixture.baseUrl);
      const productsResponse = await fetch(
        fixture.baseUrl + "/products?page=1&page_size=25",
        { headers },
      );
      expect(productsResponse.status).toBe(200);
      const products = productPageSchema.parse(await productsResponse.json());
      expect(products).toMatchObject({ total: 31, page: 1, page_size: 25 });
      expect(products.items).toHaveLength(25);

      const nextProducts = productPageSchema.parse(
        await (
          await fetch(fixture.baseUrl + "/products?page=2&page_size=25", {
            headers,
          })
        ).json(),
      );
      expect(nextProducts.items).toHaveLength(6);
      expect(
        [...products.items, ...nextProducts.items].some(
          (product) => product.product_name.length > 60,
        ),
      ).toBe(true);

      const filteredProducts = productPageSchema.parse(
        await (
          await fetch(
            fixture.baseUrl + "/products?search=Product+31&is_active=true",
            { headers },
          )
        ).json(),
      );
      expect(filteredProducts).toMatchObject({ total: 1, page: 1 });
      expect(filteredProducts.items[0].product_name).toBe("Fixture Product 31");

      const stockItems = stockItemPageSchema.parse(
        await (
          await fetch(
            fixture.baseUrl +
              "/stock-items?page=1&page_size=100&is_active=true",
            { headers },
          )
        ).json(),
      );
      expect(stockItems.items).toHaveLength(25);
      const flour = stockItems.items[0];
      const oil = stockItems.items[1];
      const allStockItems = stockItemPageSchema.parse(
        await (
          await fetch(fixture.baseUrl + "/stock-items?page=1&page_size=100", {
            headers,
          })
        ).json(),
      );

      const existingRecipe = recipeResponseSchema.parse(
        await (
          await fetch(
            fixture.baseUrl + "/products/" + fixtureProductId(0) + "/recipe",
            { headers },
          )
        ).json(),
      );
      expect(existingRecipe.items[0]).toMatchObject({
        stock_item_id: flour.id,
        quantity_required: "0.0250",
        stock_item_is_active: true,
      });
      expect(existingRecipe.items[1]).toMatchObject({
        stock_item_id: allStockItems.items[2].id,
        stock_item_is_active: false,
        quantity_required: "0.500",
      });

      const emptyRecipeResponse = await fetch(
        fixture.baseUrl + "/products/" + fixtureProductId(1) + "/recipe",
        { headers },
      );
      expect(
        recipeResponseSchema.parse(await emptyRecipeResponse.json()).items,
      ).toEqual([]);

      const recipeCreateBody = {
        items: [{ stock_item_id: flour.id, quantity_required: "0.00750" }],
      };
      const recipeCreateResponse = await fetch(
        fixture.baseUrl + "/products/" + fixtureProductId(1) + "/recipe",
        {
          method: "POST",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify(recipeCreateBody),
        },
      );
      expect(recipeCreateResponse.status).toBe(201);
      expect(
        recipeResponseSchema.parse(await recipeCreateResponse.json()).items[0],
      ).toMatchObject({
        stock_item_id: flour.id,
        quantity_required: "0.00750",
        stock_item_is_active: true,
      });
      const duplicateRecipe = await fetch(
        fixture.baseUrl + "/products/" + fixtureProductId(1) + "/recipe",
        {
          method: "POST",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify(recipeCreateBody),
        },
      );
      expect(duplicateRecipe.status).toBe(409);

      const recipeUpdateResponse = await fetch(
        fixture.baseUrl + "/products/" + fixtureProductId(0) + "/recipe",
        {
          method: "PUT",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({
            items: [{ stock_item_id: oil.id, quantity_required: "1.2000" }],
          }),
        },
      );
      expect(
        recipeResponseSchema.parse(await recipeUpdateResponse.json()).items,
      ).toMatchObject([{ stock_item_id: oil.id, quantity_required: "1.2000" }]);

      const branchId = "10000000-0000-4000-8000-000000000001";
      const branchProductsResponse = await fetch(
        fixture.baseUrl + `/branches/${branchId}/products?page=1&page_size=25`,
        { headers },
      );
      const branchProducts = branchProductPageSchema.parse(
        await branchProductsResponse.json(),
      );
      expect(branchProducts).toMatchObject({ total: 26, page: 1 });
      expect(branchProducts.items).toHaveLength(25);

      const nextOffers = branchProductPageSchema.parse(
        await (
          await fetch(
            fixture.baseUrl +
              `/branches/${branchId}/products?page=2&page_size=25`,
            { headers },
          )
        ).json(),
      );
      expect(nextOffers.items).toHaveLength(1);
      expect(
        [...branchProducts.items, ...nextOffers.items].some(
          (offer) => offer.product_name.length > 60,
        ),
      ).toBe(true);

      const availableOffers = branchProductPageSchema.parse(
        await (
          await fetch(
            fixture.baseUrl +
              `/branches/${branchId}/products?is_available=true`,
            { headers },
          )
        ).json(),
      );
      expect(availableOffers.total).toBe(13);
      expect(availableOffers.items.every((offer) => offer.is_available)).toBe(
        true,
      );
      const searchedOffers = branchProductPageSchema.parse(
        await (
          await fetch(
            fixture.baseUrl + `/branches/${branchId}/products?search=Chicken`,
            { headers },
          )
        ).json(),
      );
      expect(searchedOffers).toMatchObject({ total: 1, page: 1 });

      const offeringId = fixtureProductId(30);
      const offerBody = { product_id: offeringId, price: "25.4000" };
      await fetch(fixture.baseUrl + "/__fixture/fail-next", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          path: `/branches/${branchId}/products`,
          status: 503,
          message: "Fixture branch product service unavailable.",
        }),
      });
      const failedOffer = await fetch(
        fixture.baseUrl + `/branches/${branchId}/products`,
        {
          method: "POST",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify(offerBody),
        },
      );
      expect(failedOffer.status).toBe(503);

      const createOfferResponse = await fetch(
        fixture.baseUrl + `/branches/${branchId}/products`,
        {
          method: "POST",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify(offerBody),
        },
      );
      expect(createOfferResponse.status).toBe(201);
      expect(
        branchProductSchema.parse(await createOfferResponse.json()),
      ).toMatchObject({
        branch_id: branchId,
        product_id: offeringId,
        price: "25.4000",
        is_available: true,
      });

      const duplicateOffer = await fetch(
        fixture.baseUrl + `/branches/${branchId}/products`,
        {
          method: "POST",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify(offerBody),
        },
      );
      expect(duplicateOffer.status).toBe(409);

      const priceResponse = await fetch(
        fixture.baseUrl + `/branches/${branchId}/products/${offeringId}`,
        {
          method: "PATCH",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({ price: "26.1234" }),
        },
      );
      expect(branchProductSchema.parse(await priceResponse.json()).price).toBe(
        "26.1234",
      );

      const availabilityResponse = await fetch(
        fixture.baseUrl +
          `/branches/${branchId}/products/${offeringId}/availability`,
        {
          method: "POST",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({ is_available: false }),
        },
      );
      expect(
        branchProductSchema.parse(await availabilityResponse.json())
          .is_available,
      ).toBe(false);

      const inactivePrice = await fetch(
        fixture.baseUrl +
          `/branches/${branchId}/products/${fixtureProductId(2)}`,
        {
          method: "PATCH",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({ price: "5.00" }),
        },
      );
      expect(inactivePrice.status).toBe(409);

      const productRenameResponse = await fetch(
        fixture.baseUrl + `/products/${fixtureProductId(0)}`,
        {
          method: "PATCH",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({
            product_name: "Updated chicken sandwich",
            description: "Fixture product details after an edit.",
          }),
        },
      );
      expect(
        productSchema.parse(await productRenameResponse.json()).product_name,
      ).toBe("Updated chicken sandwich");
      const renamedOfferResponse = await fetch(
        fixture.baseUrl +
          `/branches/${branchId}/products?search=Updated+chicken`,
        { headers },
      );
      const renamedOffers = branchProductPageSchema.parse(
        await renamedOfferResponse.json(),
      );
      expect(renamedOffers).toMatchObject({ total: 1 });
      expect(renamedOffers.items[0]).toMatchObject({
        product_id: fixtureProductId(0),
        product_name: "Updated chicken sandwich",
        description: "Fixture product details after an edit.",
      });

      await fetch(fixture.baseUrl + "/__fixture/fail-next", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          path: "/products",
          status: 503,
          message: "Fixture product service unavailable.",
        }),
      });
      const failedProduct = await fetch(fixture.baseUrl + "/products", {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({
          product_name: "Fixture added product",
          description: "Created through the operational fixture.",
        }),
      });
      expect(failedProduct.status).toBe(503);
      const createdProductResponse = await fetch(
        fixture.baseUrl + "/products",
        {
          method: "POST",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({
            product_name: "Fixture added product",
            description: "Created through the operational fixture.",
          }),
        },
      );
      const createdProduct = productSchema.parse(
        await createdProductResponse.json(),
      );
      expect(createdProduct).toMatchObject({
        product_name: "Fixture added product",
        is_active: true,
      });

      const updateProductResponse = await fetch(
        fixture.baseUrl + `/products/${createdProduct.id}`,
        {
          method: "PATCH",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({ product_name: "Fixture product updated" }),
        },
      );
      expect(
        productSchema.parse(await updateProductResponse.json()).product_name,
      ).toBe("Fixture product updated");
      const deactivateProductResponse = await fetch(
        fixture.baseUrl + `/products/${createdProduct.id}/deactivate`,
        { method: "POST", headers },
      );
      expect(
        productSchema.parse(await deactivateProductResponse.json()).is_active,
      ).toBe(false);
    } finally {
      await fixture.close();
    }
  });

  it("serves paginated branch sales and schema-valid sale detail snapshots", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const headers = await getAuthenticatedHeaders(fixture.baseUrl);
      const branchId = "10000000-0000-4000-8000-000000000001";
      const firstId = "65000000-0000-4000-8000-000000000001";
      const firstResponse = await fetch(
        fixture.baseUrl + `/branches/${branchId}/sales?page=1&page_size=25`,
        { headers },
      );
      expect(firstResponse.status).toBe(200);
      const firstPage = salePageSchema.parse(await firstResponse.json());
      expect(firstPage).toMatchObject({ total: 26, page: 1, page_size: 25 });
      expect(firstPage.items).toHaveLength(25);
      expect(firstPage.items[0].id).toBe(firstId);
      expect(firstPage.items[0].cashier_name.length).toBeGreaterThan(20);

      const secondResponse = await fetch(
        fixture.baseUrl + `/branches/${branchId}/sales?page=2&page_size=25`,
        { headers },
      );
      expect(
        salePageSchema.parse(await secondResponse.json()).items,
      ).toHaveLength(1);

      const detailResponse = await fetch(
        fixture.baseUrl + `/branches/${branchId}/sales/${firstId}`,
        { headers },
      );
      const detail = saleDetailSchema.parse(await detailResponse.json());
      expect(detail).toMatchObject({
        id: firstId,
        branch_id: branchId,
        status: "COMPLETED",
        tender_method: "cash",
      });
      expect(detail.items[0].product_name_snapshot.length).toBeGreaterThan(20);
      expect(detail.events[0].event_type).toBe("COMPLETED");

      const wrongBranchDetail = await fetch(
        fixture.baseUrl +
          "/branches/10000000-0000-4000-8000-000000000002/sales/" +
          firstId,
        { headers },
      );
      expect(wrongBranchDetail.status).toBe(404);
    } finally {
      await fixture.close();
    }
  });

  it("creates sales with exact decimals, rejects key conflicts, and supports safe retries", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const headers = await getAuthenticatedHeaders(fixture.baseUrl);
      const branchId = "10000000-0000-4000-8000-000000000001";
      const productId = fixtureProductId(0);
      const idempotencyKey = "76000000-0000-4000-8000-000000000001";
      const path = `/branches/${branchId}/sales`;
      const body = {
        tender_method: "cash",
        items: [{ product_id: productId, quantity: "0.1250" }],
      };
      await fetch(fixture.baseUrl + "/__fixture/fail-next", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          path,
          status: 503,
          message: "Fixture sale service unavailable.",
        }),
      });

      const failedAttempt = await fetch(fixture.baseUrl + path, {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(body),
      });
      expect(failedAttempt.status).toBe(503);

      const create = () =>
        fetch(fixture.baseUrl + path, {
          method: "POST",
          headers: {
            ...headers,
            "content-type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(body),
        });
      const firstResponse = await create();
      expect(firstResponse.status).toBe(201);
      const firstSale = saleDetailSchema.parse(await firstResponse.json());
      expect(firstSale).toMatchObject({
        branch_id: branchId,
        tender_method: "cash",
        total_amount: "12.5",
        status: "COMPLETED",
      });
      expect(firstSale.items[0]).toMatchObject({
        quantity: "0.125",
        unit_price: "100.0000",
        line_total: "12.5",
      });

      const retryResponse = await create();
      expect(saleDetailSchema.parse(await retryResponse.json()).id).toBe(
        firstSale.id,
      );
      const conflictResponse = await fetch(fixture.baseUrl + path, {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          ...body,
          items: [{ product_id: productId, quantity: "0.25" }],
        }),
      });
      expect(conflictResponse.status).toBe(409);
      const invalidQuantity = await fetch(fixture.baseUrl + path, {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          "Idempotency-Key": "76000000-0000-4000-8000-000000000005",
        },
        body: JSON.stringify({
          ...body,
          items: [{ product_id: productId, quantity: "01.0" }],
        }),
      });
      expect(invalidQuantity.status).toBe(400);
      const fixtureState = (await (
        await fetch(fixture.baseUrl + "/__fixture/state")
      ).json()) as { sales: unknown[] };
      expect(fixtureState.sales).toHaveLength(27);
    } finally {
      await fixture.close();
    }
  });

  it("records a reasoned void reversal and makes void retries idempotent", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const headers = await getAuthenticatedHeaders(fixture.baseUrl);
      const branchId = "10000000-0000-4000-8000-000000000001";
      const salePath = `/branches/${branchId}/sales`;
      const createdResponse = await fetch(fixture.baseUrl + salePath, {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          "Idempotency-Key": "76000000-0000-4000-8000-000000000002",
        },
        body: JSON.stringify({
          tender_method: "card",
          items: [{ product_id: fixtureProductId(0), quantity: "1" }],
        }),
      });
      const created = saleDetailSchema.parse(await createdResponse.json());
      const path = salePath + `/${created.id}/void`;
      const idempotencyKey = "76000000-0000-4000-8000-000000000003";
      const sendVoid = () =>
        fetch(fixture.baseUrl + path, {
          method: "POST",
          headers: {
            ...headers,
            "content-type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({ reason: "Cashier selected the wrong item." }),
        });

      const firstVoid = await sendVoid();
      expect(firstVoid.status).toBe(200);
      const voidedSale = saleDetailSchema.parse(await firstVoid.json());
      expect(voidedSale.status).toBe("VOIDED");
      expect(voidedSale.events.at(-1)).toMatchObject({
        event_type: "VOIDED",
        reason: "Cashier selected the wrong item.",
      });
      const retryVoid = saleDetailSchema.parse(await (await sendVoid()).json());
      expect(retryVoid.events).toHaveLength(voidedSale.events.length);
      expect(retryVoid.status).toBe("VOIDED");

      const duplicateVoid = await fetch(fixture.baseUrl + path, {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          "Idempotency-Key": "76000000-0000-4000-8000-000000000004",
        },
        body: JSON.stringify({ reason: "Duplicate attempt." }),
      });
      expect(duplicateVoid.status).toBe(409);
    } finally {
      await fixture.close();
    }
  });

  it("serves schema-valid daily reports and simulates create, count, submit, return, and approval flows", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const headers = await getAuthenticatedHeaders(fixture.baseUrl);
      const branchId = "10000000-0000-4000-8000-000000000001";
      const reportPath = `/branches/${branchId}/daily-reports`;
      const firstPage = dailyReportPageSchema.parse(
        await (
          await fetch(`${fixture.baseUrl}${reportPath}?page=1&page_size=25`, {
            headers,
          })
        ).json(),
      );
      expect(firstPage.items).toHaveLength(25);
      expect(firstPage.total).toBe(26);
      expect(
        new Set(firstPage.items.map((item) => item.status)).size,
      ).toBeGreaterThan(1);
      const secondPage = dailyReportPageSchema.parse(
        await (
          await fetch(`${fixture.baseUrl}${reportPath}?page=2&page_size=25`, {
            headers,
          })
        ).json(),
      );
      expect(secondPage.items).toHaveLength(1);

      const initial = dailyReportDetailSchema.parse(
        await (
          await fetch(`${fixture.baseUrl}${reportPath}/${fixtureReportId(0)}`, {
            headers,
          })
        ).json(),
      );
      expect(initial.items).toHaveLength(2);
      expect(initial.items[0]?.physical_closing_quantity).toBeNull();

      const idempotencyKey = "76000000-0000-4000-8000-000000000021";
      const createBody = { business_date: "2026-09-24" };
      const failNext = await fetch(`${fixture.baseUrl}/__fixture/fail-next`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          path: reportPath,
          status: 503,
          message: "Fixture report service unavailable.",
        }),
      });
      expect(failNext.status).toBe(204);
      const failedCreate = await fetch(`${fixture.baseUrl}${reportPath}`, {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(createBody),
      });
      expect(failedCreate.status).toBe(503);
      const createdResponse = await fetch(`${fixture.baseUrl}${reportPath}`, {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(createBody),
      });
      const created = dailyReportDetailSchema.parse(
        await createdResponse.json(),
      );
      expect(created.status).toBe("DRAFT");
      const retry = dailyReportDetailSchema.parse(
        await (
          await fetch(`${fixture.baseUrl}${reportPath}`, {
            method: "POST",
            headers: {
              ...headers,
              "content-type": "application/json",
              "Idempotency-Key": idempotencyKey,
            },
            body: JSON.stringify(createBody),
          })
        ).json(),
      );
      expect(retry.id).toBe(created.id);

      const update = await fetch(
        `${fixture.baseUrl}${reportPath}/${created.id}`,
        {
          method: "PUT",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({
            items: created.items.map((item, index) => ({
              stock_item_id: item.stock_item_id,
              physical_closing_quantity: index === 0 ? "10.5" : "3",
              waste_quantity: index === 0 ? "0.5" : "0",
              waste_reason: index === 0 ? "Damaged during prep" : "",
              adjustment_quantity: index === 0 ? "-0.25" : "0",
              adjustment_reason: index === 0 ? "Count correction" : "",
            })),
          }),
        },
      );
      const updated = dailyReportDetailSchema.parse(await update.json());
      expect(updated.items[0]).toMatchObject({
        expected_closing_quantity: "10.25",
        variance_quantity: "0.25",
      });

      const submittedResponse = await fetch(
        `${fixture.baseUrl}${reportPath}/${created.id}/submit`,
        {
          method: "POST",
          headers,
        },
      );
      const submitted = dailyReportDetailSchema.parse(
        await submittedResponse.json(),
      );
      expect(submitted.status).toBe("SUBMITTED");
      const approvedResponse = await fetch(
        `${fixture.baseUrl}${reportPath}/${created.id}/approve`,
        {
          method: "POST",
          headers,
        },
      );
      expect(
        dailyReportDetailSchema.parse(await approvedResponse.json()).status,
      ).toBe("APPROVED");

      const returnedPath = `${reportPath}/${fixtureReportId(1)}/return`;
      const invalidReturn = await fetch(`${fixture.baseUrl}${returnedPath}`, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ reason: " " }),
      });
      expect(invalidReturn.status).toBe(400);
      const returned = await fetch(`${fixture.baseUrl}${returnedPath}`, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ reason: "Review the physical count." }),
      });
      expect(
        dailyReportDetailSchema.parse(await returned.json()),
      ).toMatchObject({
        status: "RETURNED",
        return_reason: "Review the physical count.",
      });
    } finally {
      await fixture.close();
    }
  });

  it("serves schema-valid commissary and branch inventory with exact adjustment retries", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const headers = await getAuthenticatedHeaders(fixture.baseUrl);
      const branchId = "10000000-0000-4000-8000-000000000001";
      const commissary = inventoryPageSchema.parse(
        await (
          await fetch(
            `${fixture.baseUrl}/inventory/commissary?page=1&page_size=25`,
            { headers },
          )
        ).json(),
      );
      const branch = inventoryPageSchema.parse(
        await (
          await fetch(
            `${fixture.baseUrl}/inventory/branches/${branchId}?page=1&page_size=25`,
            { headers },
          )
        ).json(),
      );
      expect(commissary.items).toHaveLength(25);
      expect(branch.items[0]?.quantity_on_hand).toBe("20.25");
      expect(
        inventoryMovementPageSchema.parse(
          await (
            await fetch(
              `${fixture.baseUrl}/inventory/commissary/movements?page=1&page_size=25`,
              { headers },
            )
          ).json(),
        ).items,
      ).toHaveLength(25);
      const secondBranchMovements = inventoryMovementPageSchema.parse(
        await (
          await fetch(
            `${fixture.baseUrl}/inventory/branches/10000000-0000-4000-8000-000000000002/movements?page=1&page_size=25`,
            { headers },
          )
        ).json(),
      );
      const firstBranchMovements = inventoryMovementPageSchema.parse(
        await (
          await fetch(
            `${fixture.baseUrl}/inventory/branches/${branchId}/movements?page=1&page_size=25`,
            { headers },
          )
        ).json(),
      );
      expect(
        new Set(
          [...firstBranchMovements.items, ...secondBranchMovements.items].map(
            (item) => item.id,
          ),
        ).size,
      ).toBe(50);

      const key = "76000000-0000-4000-8000-000000000031";
      const path = "/inventory/branches/" + branchId + "/adjustments";
      const body = {
        stock_item_id: branch.items[0]!.id,
        quantity_delta: "0.75",
        reason: "Cycle count correction",
      };
      const sendAdjustment = () =>
        fetch(fixture.baseUrl + path, {
          method: "POST",
          headers: {
            ...headers,
            "content-type": "application/json",
            "Idempotency-Key": key,
          },
          body: JSON.stringify(body),
        });
      const first = await sendAdjustment();
      expect(first.status).toBe(201);
      const movement = inventoryMovementPageSchema.shape.items.element.parse(
        (await first.json()).movement,
      );
      expect(movement).toMatchObject({
        quantity_delta: "0.75",
        reason: "Cycle count correction",
        inventory_scope: "BRANCH",
        branch_id: branchId,
      });
      const retry = await sendAdjustment();
      expect(retry.status).toBe(201);
      const afterRetry = await fetch(
        `${fixture.baseUrl}/inventory/branches/${branchId}?page=1&page_size=25`,
        { headers },
      );
      expect(
        inventoryPageSchema.parse(await afterRetry.json()).items[0]
          ?.quantity_on_hand,
      ).toBe("21");
    } finally {
      await fixture.close();
    }
  });

  it("serves schema-valid global and branch dashboard summaries for a Manila date range", async () => {
    const fixture = await createOperationalApiFixture({ gatewaySecret });
    try {
      const headers = await getAuthenticatedHeaders(fixture.baseUrl);
      const branchId = "10000000-0000-4000-8000-000000000001";
      const period = "from=2026-09-01&to=2026-09-28";
      const globalResponse = await fetch(
        `${fixture.baseUrl}/dashboard/overview?${period}`,
        { headers },
      );
      expect(globalResponse.status).toBe(200);
      const global = dashboardResponseSchema.parse(await globalResponse.json());
      expect(global.period).toEqual({
        from: "2026-09-01",
        to: "2026-09-28",
        time_zone: "Asia/Manila",
      });
      expect(global.branches).toHaveLength(26);
      expect(global.summary.completed_sales_count).toBeGreaterThan(0);
      expect(global.summary.open_discrepancies_count).toBeGreaterThan(0);
      expect(global.sales_trend.some((day) => day.completed_sales_count > 0)).toBe(
        true,
      );

      const selected = dashboardResponseSchema.parse(
        await (
          await fetch(
            `${fixture.baseUrl}/dashboard/overview?${period}&branch_id=${branchId}`,
            { headers },
          )
        ).json(),
      );
      expect(selected.branches.map((branch) => branch.branch_id)).toEqual([
        branchId,
      ]);

      const assigned = dashboardResponseSchema.parse(
        await (
          await fetch(
            `${fixture.baseUrl}/branches/${branchId}/dashboard?${period}`,
            { headers },
          )
        ).json(),
      );
      expect(assigned.branches.map((branch) => branch.branch_id)).toEqual([
        branchId,
      ]);
      expect(assigned.summary).toEqual(selected.summary);
    } finally {
      await fixture.close();
    }
  });
});
