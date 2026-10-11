import { beforeEach, describe, expect, it, vi } from "vitest";
import { authTestSessionUser } from "@/test/auth-fixtures";
import {
  createPaymentMethodAction,
  updatePaymentMethodAction,
  deactivatePaymentMethodAction,
  getAvailablePaymentMethodsAction,
} from "./payment-method-actions";
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  request: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "coms_access=test" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/features/auth/services/auth-server", () => ({
  getCurrentUserFromServer: mocks.session,
}));
vi.mock("@/services/server-api-services", () => ({
  requestComsApi: mocks.request,
}));
const id = "a34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const input = { name: "  Card  ", kind: "NON_CASH", status: "enabled" };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({
    status: "authenticated",
    user: {
      ...authTestSessionUser,
      role: {
        ...authTestSessionUser.role,
        code: "SUPER_ADMIN",
        isSystem: true,
      },
    },
  });
  mocks.request.mockResolvedValue({
    id,
    name: "Card",
    kind: "NON_CASH",
    is_active: true,
  });
});
describe("payment method actions", () => {
  it("protects every mutation even when called directly", async () => {
    mocks.session.mockResolvedValue({
      status: "authenticated",
      user: authTestSessionUser,
    });
    for (const result of [
      await createPaymentMethodAction(input),
      await updatePaymentMethodAction(id, input),
      await deactivatePaymentMethodAction(id),
    ])
      expect(result.ok).toBe(false);
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("validates and maps name, type and status without trusting extra fields", async () => {
    expect((await createPaymentMethodAction({ ...input, price: 1 })).ok).toBe(
      false,
    );
    expect(await createPaymentMethodAction(input)).toEqual({ ok: true });
    expect(mocks.request).toHaveBeenCalledWith(
      "/payment-methods",
      expect.objectContaining({
        method: "POST",
        body: { name: "Card", kind: "NON_CASH", is_active: true },
      }),
    );
    expect(
      await updatePaymentMethodAction(id, { ...input, status: "disabled" }),
    ).toEqual({ ok: true });
    expect(mocks.request).toHaveBeenLastCalledWith(
      `/payment-methods/${id}`,
      expect.objectContaining({
        method: "PATCH",
        body: expect.objectContaining({ is_active: false }),
      }),
    );
  });
  it("restricts POS lookup to users allowed to create sales", async () => {
    mocks.session.mockResolvedValue({
      status: "authenticated",
      user: authTestSessionUser,
    });
    await expect(getAvailablePaymentMethodsAction()).rejects.toThrow();
    expect(mocks.request).not.toHaveBeenCalled();
  });
});
