import { beforeEach, expect, it, vi } from "vitest";
import { updateBranchProductAvailabilityAction } from "./branch-product-actions";
const { request, session } = vi.hoisted(() => ({
  request: vi.fn(),
  session: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/auth/services/auth-server", () => ({
  getCurrentUserFromServer: session,
}));
vi.mock("@/services/server-api-services", () => ({ requestComsApi: request }));
const id = "00000000-0000-4000-8000-000000000001";
beforeEach(() => {
  request.mockReset();
  session.mockReset();
});
it("rejects a branch manager even when old menu write grants remain", async () => {
  session.mockResolvedValue({
    status: "authenticated",
    user: {
      role: { isActive: true, isSystem: false, code: "BRANCH_MANAGER" },
      permissions: ["branch_products.availability_update"],
      branch_ids: [id],
    },
  });
  expect(
    await updateBranchProductAvailabilityAction(id, id, { is_available: true }),
  ).toMatchObject({ ok: false, error: expect.stringContaining("Super Admin") });
  expect(request).not.toHaveBeenCalled();
});
it("rejects malformed availability and forged price", async () => {
  expect(
    await updateBranchProductAvailabilityAction(id, id, {
      is_available: true,
      price: "0.01",
    }),
  ).toMatchObject({ ok: false });
  expect(session).not.toHaveBeenCalled();
});
it("posts administrator availability and refreshes dependent screens", async () => {
  session.mockResolvedValue({
    status: "authenticated",
    user: { role: { isActive: true, isSystem: true, code: "SUPER_ADMIN" } },
  });
  request.mockResolvedValue({
    branch_id: id,
    product_id: id,
    product_name: "Test meal",
    description: null,
    category_id: "aa000000-0000-4000-8000-000000000001",
    category_name: "Rice meals",
    category_is_active: true,
    product_is_active: true,
    price: "1",
    price_revision: 1,
    is_available: true,
    created_at: "2026-10-10T00:00:00.000Z",
    updated_at: "2026-10-10T00:00:00.000Z",
  });
  expect(
    await updateBranchProductAvailabilityAction(id, id, { is_available: true }),
  ).toEqual({ ok: true });
  expect(request.mock.calls[0][1].body).toEqual({ is_available: true });
});
