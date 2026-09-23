import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";
import { saveRecipeAction } from "./recipe-actions";

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

const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const stockItemId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const timestamp = "2026-09-24T01:30:00.000Z";
const recipe = {
  product: {
    id: productId,
    product_name: "Chicken sandwich",
    description: null,
    is_active: true,
  },
  items: [
    {
      product_id: productId,
      stock_item_id: stockItemId,
      stock_item_name: "Flour",
      unit: "kg",
      stock_item_is_active: true,
      quantity_required: "0.0250",
      created_at: timestamp,
      updated_at: timestamp,
    },
  ],
};

function session(permissions: string[]) {
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
      branch_ids: [],
    },
  };
}

describe("recipe actions", () => {
  beforeEach(() => {
    cookies
      .mockReset()
      .mockResolvedValue({ toString: () => "coms_access=token" });
    getCurrentUserFromServer
      .mockReset()
      .mockResolvedValue(
        session(["recipes.create", "recipes.update", "stock_items.read"]),
      );
    requestComsApi.mockReset().mockResolvedValue(recipe);
    revalidatePath.mockReset();
  });

  it("rejects invalid data and missing permissions before calling the API", async () => {
    await expect(
      saveRecipeAction(productId, "create", {
        items: [{ stock_item_id: stockItemId, quantity_required: "0" }],
      }),
    ).resolves.toMatchObject({ ok: false });
    expect(getCurrentUserFromServer).not.toHaveBeenCalled();

    getCurrentUserFromServer.mockResolvedValueOnce(session(["recipes.read"]));
    await expect(
      saveRecipeAction(productId, "create", {
        items: [{ stock_item_id: stockItemId, quantity_required: "1" }],
      }),
    ).resolves.toEqual({
      ok: false,
      error: "You do not have permission to manage recipes.",
    });
    expect(requestComsApi).not.toHaveBeenCalled();
  });

  it("rejects an unsupported recipe operation before calling the API", async () => {
    await expect(
      saveRecipeAction(productId, "delete", {
        items: [{ stock_item_id: stockItemId, quantity_required: "1" }],
      }),
    ).resolves.toEqual({
      ok: false,
      error: "Select a valid recipe operation.",
    });
    expect(requestComsApi).not.toHaveBeenCalled();
  });

  it("posts recipe creation and puts recipe replacement with cookie relay", async () => {
    const input = {
      items: [{ stock_item_id: stockItemId, quantity_required: "0.0250" }],
    };
    await expect(saveRecipeAction(productId, "create", input)).resolves.toEqual(
      { ok: true },
    );
    expect(requestComsApi).toHaveBeenLastCalledWith(
      `/products/${productId}/recipe`,
      {
        cookieHeader: "coms_access=token",
        method: "POST",
        body: input,
      },
    );
    await expect(saveRecipeAction(productId, "update", input)).resolves.toEqual(
      { ok: true },
    );
    expect(requestComsApi).toHaveBeenLastCalledWith(
      `/products/${productId}/recipe`,
      {
        cookieHeader: "coms_access=token",
        method: "PUT",
        body: input,
      },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/recipes");
    expect(revalidatePath).toHaveBeenCalledWith(`/recipes/${productId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/products");
  });

  it("requires stock item read permission and maps API errors", async () => {
    getCurrentUserFromServer.mockResolvedValueOnce(session(["recipes.create"]));
    await expect(
      saveRecipeAction(productId, "create", {
        items: [{ stock_item_id: stockItemId, quantity_required: "1" }],
      }),
    ).resolves.toEqual({
      ok: false,
      error: "Stock item access is required to edit recipes.",
    });
    expect(requestComsApi).not.toHaveBeenCalled();

    requestComsApi.mockRejectedValueOnce(new ApiRequestError("denied", 403));
    await expect(
      saveRecipeAction(productId, "create", {
        items: [{ stock_item_id: stockItemId, quantity_required: "1" }],
      }),
    ).resolves.toEqual({
      ok: false,
      error: "You do not have permission to manage recipes.",
    });
  });
});
