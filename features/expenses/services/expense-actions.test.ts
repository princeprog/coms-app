import { beforeEach, describe, expect, it, vi } from "vitest";
import { authTestSessionUser } from "@/test/auth-fixtures";
import { ApiRequestError } from "@/services/api-services";
import {
  getExpenseAction,
  getExpenseCashOutsAction,
  getExpenseLocationsAction,
  listExpensesAction,
  saveExpenseAction,
  saveExpenseCategoryAction,
  voidExpenseAction,
} from "./expense-actions";
import { defaultExpenseQuery } from "./expense-query";
import { expense, ids, input, category } from "../test-fixtures";
const mocks = vi.hoisted(() => ({ session: vi.fn(), request: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "coms_access=test" }),
}));
vi.mock("@/features/auth/services/auth-server", () => ({
  getCurrentUserFromServer: mocks.session,
}));
vi.mock("@/services/server-api-services", () => ({
  requestComsApi: mocks.request,
}));
function grants(permissions: string[]) {
  mocks.session.mockResolvedValue({
    status: "authenticated",
    user: { ...authTestSessionUser, permissions },
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  grants([
    "expenses.read",
    "expenses.create",
    "expenses.update",
    "expenses.void",
    "expenses.categories_manage",
    "shifts.read",
  ]);
  mocks.request.mockResolvedValue({ record: expense, history: [] });
});
describe("expense server actions", () => {
  it("does not let global or commissary read imply mutation or base read", async () => {
    grants(["expenses.global_read", "expenses.commissary_read"]);
    expect((await getExpenseLocationsAction()).ok).toBe(false);
    expect((await saveExpenseAction(undefined, input, ids.key)).ok).toBe(false);
    grants(["expenses.read", "expenses.global_read"]);
    expect(
      (
        await voidExpenseAction(
          ids.expense,
          { revision: 2, reason: "Duplicate" },
          ids.key,
        )
      ).ok,
    ).toBe(false);
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("forwards exact money, revision, reason and idempotency key", async () => {
    expect(
      (
        await saveExpenseAction(
          ids.expense,
          { ...input, revision: 2, reason: "  Corrected invoice  " },
          ids.key,
        )
      ).ok,
    ).toBe(true);
    expect(mocks.request).toHaveBeenCalledWith(
      `/expenses/${ids.expense}`,
      expect.objectContaining({
        method: "PATCH",
        headers: { "Idempotency-Key": ids.key },
        body: { ...input, revision: 2, reason: "Corrected invoice" },
      }),
    );
  });
  it("rejects malformed input before transport", async () => {
    expect(
      (await saveExpenseAction(undefined, { ...input, amount: "0" }, ids.key))
        .ok,
    ).toBe(false);
    expect((await saveExpenseAction(ids.expense, input, ids.key)).ok).toBe(
      false,
    );
    expect(
      (
        await voidExpenseAction(
          ids.expense,
          { revision: 2, reason: "" },
          ids.key,
        )
      ).ok,
    ).toBe(false);
    expect((await getExpenseAction("OTHER", ids.expense)).ok).toBe(false);
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("preserves conflict details for correction and retry recovery", async () => {
    mocks.request.mockRejectedValue(
      new ApiRequestError(
        "Expense was changed. Reload it before editing.",
        409,
      ),
    );
    expect(
      await saveExpenseAction(
        ids.expense,
        { ...input, revision: 2, reason: "Correction" },
        ids.key,
      ),
    ).toEqual({
      ok: false,
      status: 409,
      error: "Expense was changed. Reload it before editing.",
    });
  });
  it("keeps cash-out searches behind shifts.read", async () => {
    grants(["expenses.read"]);
    expect(
      (
        await getExpenseCashOutsAction({
          branch_id: ids.branch,
          search: "",
          page: 1,
          page_size: 10,
        })
      ).ok,
    ).toBe(false);
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("requires category management and rejects reserved category names", async () => {
    grants(["expenses.read"]);
    expect(
      (await saveExpenseCategoryAction(undefined, { name: "Fuel" })).ok,
    ).toBe(false);
    grants(["expenses.read", "expenses.categories_manage"]);
    expect(
      (await saveExpenseCategoryAction(undefined, { name: "Stock purchases" }))
        .ok,
    ).toBe(false);
    mocks.request.mockResolvedValue(category);
    expect(
      (await saveExpenseCategoryAction(ids.category, { is_active: false })).ok,
    ).toBe(true);
    expect(mocks.request).toHaveBeenLastCalledWith(
      `/expenses/categories/${ids.category}`,
      expect.objectContaining({ method: "PATCH", body: { is_active: false } }),
    );
  });
  it("rejects malformed responses and handles unauthenticated sessions", async () => {
    mocks.request.mockResolvedValue({ items: [] });
    expect((await listExpensesAction(defaultExpenseQuery())).ok).toBe(false);
    mocks.session.mockResolvedValue({ status: "unauthenticated" });
    expect(await getExpenseLocationsAction()).toMatchObject({
      ok: false,
      status: 401,
    });
  });
});
