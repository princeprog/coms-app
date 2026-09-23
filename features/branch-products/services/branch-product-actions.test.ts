import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";
import {
  createBranchProductAction,
  updateBranchProductAvailabilityAction,
  updateBranchProductPriceAction,
} from "./branch-product-actions";

const { cookies, getCurrentUserFromServer, requestComsApi, revalidatePath } =
  vi.hoisted(() => ({
    cookies: vi.fn(),
    getCurrentUserFromServer: vi.fn(),
    requestComsApi: vi.fn(),
    revalidatePath: vi.fn(),
  }));

vi.mock("next/headers", () => ({ cookies }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/features/auth/services/auth-server", () => ({
  getCurrentUserFromServer,
}));
vi.mock("@/services/server-api-services", () => ({ requestComsApi }));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const otherBranchId = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const timestamp = "2026-09-24T01:30:00.000Z";
const offer = {
  branch_id: branchId,
  branch_name: "Downtown",
  product_id: productId,
  product_name: "Chicken sandwich",
  description: null,
  product_is_active: true,
  price: "125.0000",
  is_available: true,
  created_at: timestamp,
  updated_at: timestamp,
};

function session(permissions: string[], branchIds: string[] = [branchId]) {
  return {
    status: "authenticated",
    user: {
      id: productId,
      email: "manager@example.com",
      full_name: "Branch Manager",
      contact_number: "",
      role: {
        id: "1",
        code: "BRANCH_MANAGER",
        name: "Branch Manager",
        isSystem: false,
        isActive: true,
      },
      permissions,
      branch_ids: branchIds,
    },
  };
}

describe("branch product actions", () => {
  beforeEach(() => {
    cookies.mockReset().mockResolvedValue({
      toString: () =>
        "theme=dark; coms_access=access-token; coms_refresh=refresh",
    });
    getCurrentUserFromServer
      .mockReset()
      .mockResolvedValue(
        session([
          "branch_products.create",
          "branch_products.update",
          "branch_products.availability_update",
        ]),
      );
    requestComsApi.mockReset().mockResolvedValue(offer);
    revalidatePath.mockReset();
  });

  it("rejects invalid IDs and payloads before authentication or API access", async () => {
    await expect(
      createBranchProductAction("bad-id", {
        product_id: productId,
        price: "1",
      }),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      createBranchProductAction(branchId, {
        product_id: productId,
        price: "-1",
      }),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      updateBranchProductPriceAction(branchId, "bad-id", { price: "1" }),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      updateBranchProductAvailabilityAction(branchId, productId, {
        is_available: "false",
      }),
    ).resolves.toMatchObject({ ok: false });
    expect(getCurrentUserFromServer).not.toHaveBeenCalled();
    expect(requestComsApi).not.toHaveBeenCalled();
  });

  it("requires the matching permission and assigned branch before mutation", async () => {
    getCurrentUserFromServer.mockResolvedValueOnce(session([]));
    await expect(
      updateBranchProductPriceAction(branchId, productId, { price: "10" }),
    ).resolves.toEqual({
      ok: false,
      error: "You do not have permission to update branch product prices.",
    });

    getCurrentUserFromServer.mockResolvedValueOnce(
      session(["branch_products.create"], [branchId]),
    );
    await expect(
      createBranchProductAction(otherBranchId, {
        product_id: productId,
        price: "10",
      }),
    ).resolves.toEqual({
      ok: false,
      error: "You do not have access to this branch.",
    });
    expect(requestComsApi).not.toHaveBeenCalled();
  });

  it("sends create, price, and availability operations with the access cookie", async () => {
    const createInput = { product_id: productId, price: "125.0000" };
    const priceInput = { price: "99.50" };
    const availabilityInput = { is_available: false };

    await expect(
      createBranchProductAction(branchId, createInput),
    ).resolves.toEqual({ ok: true });
    expect(requestComsApi).toHaveBeenLastCalledWith(
      `/branches/${branchId}/products`,
      {
        cookieHeader:
          "theme=dark; coms_access=access-token; coms_refresh=refresh",
        method: "POST",
        body: createInput,
      },
    );
    await expect(
      updateBranchProductPriceAction(branchId, productId, priceInput),
    ).resolves.toEqual({ ok: true });
    expect(requestComsApi).toHaveBeenLastCalledWith(
      `/branches/${branchId}/products/${productId}`,
      {
        cookieHeader:
          "theme=dark; coms_access=access-token; coms_refresh=refresh",
        method: "PATCH",
        body: priceInput,
      },
    );
    await expect(
      updateBranchProductAvailabilityAction(
        branchId,
        productId,
        availabilityInput,
      ),
    ).resolves.toEqual({ ok: true });
    expect(requestComsApi).toHaveBeenLastCalledWith(
      `/branches/${branchId}/products/${productId}/availability`,
      {
        cookieHeader:
          "theme=dark; coms_access=access-token; coms_refresh=refresh",
        method: "POST",
        body: availabilityInput,
      },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/branch-products");
    expect(revalidatePath).toHaveBeenCalledTimes(3);
  });

  it("maps API conflicts and rejects malformed success responses", async () => {
    requestComsApi.mockRejectedValueOnce(
      new ApiRequestError("This product is already offered", 409),
    );
    await expect(
      createBranchProductAction(branchId, {
        product_id: productId,
        price: "1",
      }),
    ).resolves.toEqual({
      ok: false,
      error: "This product is already offered at the branch.",
    });

    requestComsApi.mockResolvedValueOnce({ ...offer, price: 125 });
    await expect(
      updateBranchProductPriceAction(branchId, productId, { price: "1" }),
    ).resolves.toEqual({
      ok: false,
      error:
        "COMS returned an invalid branch product response. Refresh and try again.",
    });
  });
});
