import { beforeEach, describe, expect, it, vi } from "vitest";
import { authTestSessionUser } from "@/test/auth-fixtures";
import { ApiRequestError } from "@/services/api-services";
import {
  saveProductCategoryAction,
  setProductCategoryActiveAction,
  searchAvailableCategoriesAction,
} from "./product-category-actions";
import { getProductCategories } from "./product-category-queries";
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  request: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
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
const category = {
  id: "00000000-0000-4000-8000-000000000002",
  name: "Meals",
  is_active: true,
  created_at: "2026-10-19T00:00:00.000Z",
  updated_at: "2026-10-19T00:00:00.000Z",
};
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
  mocks.request.mockResolvedValue(category);
});
describe("category server boundary", () => {
  it("creates active-only categories using name-only input and rejects invalid names", async () => {
    for (const name of ["", "a", "x".repeat(81)])
      expect((await saveProductCategoryAction(undefined, { name })).ok).toBe(
        false,
      );
    expect(
      (
        await saveProductCategoryAction(undefined, {
          name: "Meals",
          is_active: false,
        })
      ).ok,
    ).toBe(false);
    expect(mocks.request).not.toHaveBeenCalled();
    expect(
      (await saveProductCategoryAction(undefined, { name: " Meals " })).ok,
    ).toBe(true);
    expect(mocks.request).toHaveBeenCalledWith(
      "/product-categories",
      expect.objectContaining({ method: "POST", body: { name: "Meals" } }),
    );
    expect(mocks.revalidate).toHaveBeenCalledWith("/products", "layout");
  });
  it("protects list and every mutation from non-SuperAdmin callers", async () => {
    mocks.session.mockResolvedValue({
      status: "authenticated",
      user: { ...authTestSessionUser, permissions: ["products.read"] },
    });
    expect(
      (await saveProductCategoryAction(undefined, { name: "Meals" })).ok,
    ).toBe(false);
    expect(
      (await saveProductCategoryAction(category.id, { name: "Meals" })).ok,
    ).toBe(false);
    expect((await setProductCategoryActiveAction(category.id, false)).ok).toBe(
      false,
    );
    expect((await setProductCategoryActiveAction(category.id, true)).ok).toBe(
      false,
    );
    await expect(
      getProductCategories({ page: 1, page_size: 10, search: "" }),
    ).rejects.toThrow();
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("allows scoped product readers to search active options with server pagination", async () => {
    mocks.session.mockResolvedValue({
      status: "authenticated",
      user: { ...authTestSessionUser, permissions: ["products.read"] },
    });
    mocks.request.mockResolvedValue({
      items: [category],
      page: 2,
      page_size: 10,
      total: 11,
    });
    expect(
      (
        await searchAvailableCategoriesAction({
          page: 2,
          page_size: 10,
          search: "Meal",
        })
      ).ok,
    ).toBe(true);
    expect(mocks.request).toHaveBeenCalledWith(
      "/product-categories/available?page=2&page_size=10&search=Meal",
      expect.anything(),
    );
    mocks.session.mockResolvedValue({
      status: "authenticated",
      user: { ...authTestSessionUser, permissions: [] },
    });
    mocks.request.mockClear();
    expect((await searchAvailableCategoriesAction({ page: 1 })).ok).toBe(false);
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("uses archive and reactivate contracts and preserves server conflict reasons", async () => {
    mocks.request.mockRejectedValueOnce(
      new ApiRequestError(
        "Move active products before archiving this category.",
        409,
      ),
    );
    expect(await setProductCategoryActiveAction(category.id, false)).toEqual({
      ok: false,
      error: "Move active products before archiving this category.",
    });
    expect(mocks.request).toHaveBeenLastCalledWith(
      `/product-categories/${category.id}/deactivate`,
      expect.objectContaining({ method: "POST" }),
    );
    expect((await setProductCategoryActiveAction(category.id, true)).ok).toBe(
      true,
    );
    expect(mocks.request).toHaveBeenLastCalledWith(
      `/product-categories/${category.id}`,
      expect.objectContaining({ method: "PATCH", body: { is_active: true } }),
    );
    mocks.request.mockRejectedValueOnce(
      new ApiRequestError("Category name already exists.", 409),
    );
    expect(
      await saveProductCategoryAction(category.id, { name: "meals" }),
    ).toEqual({ ok: false, error: "Category name already exists." });
  });
  it("rejects malformed option responses and invalid identifiers without mutating", async () => {
    mocks.request.mockResolvedValue({
      items: [{ id: "bad" }],
      total: 1,
      page: 1,
      page_size: 10,
    });
    expect((await searchAvailableCategoriesAction({ page: 1 })).ok).toBe(false);
    mocks.request.mockClear();
    expect(
      (await saveProductCategoryAction("invalid", { name: "Meals" })).ok,
    ).toBe(false);
    expect((await setProductCategoryActiveAction("invalid", true)).ok).toBe(
      false,
    );
    expect(mocks.request).not.toHaveBeenCalled();
  });
});
