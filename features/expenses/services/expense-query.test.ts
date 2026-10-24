import { describe, expect, it } from "vitest";
import { resolveExportTarget } from "@/features/exports/export-targets";
import { cents, manilaToday, monthRange, pesos } from "./expense-format";
import { changeExpenseLocation, changeExpensePayment } from "./expense-draft";
import {
  defaultExpenseQuery,
  expenseHref,
  expenseQuerySchema,
} from "./expense-query";
import { operationKey } from "../hooks/use-expense-draft";
import { ids, input } from "../test-fixtures";
describe("expense query and draft rules", () => {
  it("uses Manila month boundaries and exact peso formatting", () => {
    expect(manilaToday(new Date("2026-10-31T16:30:00Z"))).toBe("2026-11-01");
    expect(monthRange(new Date("2028-02-02T00:00:00Z"))).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
    expect(pesos("999999999.99")).toBe("₱999,999,999.99");
    expect(cents("0.1") + cents("0.2")).toBe(cents("0.30"));
  });
  it("retains filters in URLs and exports all matches without paging", () => {
    const query = {
      ...defaultExpenseQuery(),
      scope: "BRANCH" as const,
      branch_id: ids.branch,
      category_id: "STOCK_PURCHASES",
      status: "all" as const,
      page: 3,
      page_size: 30,
      search: "invoice & rent",
    };
    const params = new URL(expenseHref(query), "http://localhost").searchParams;
    expect(expenseQuerySchema.parse(Object.fromEntries(params))).toEqual(query);
    const target = resolveExportTarget("expenses", params)!;
    expect(target).toContain("/expenses/export?");
    expect(target).toContain("category_id=STOCK_PURCHASES");
    expect(target).toContain("status=all");
    expect(target).not.toContain("page");
  });
  it("rejects inverted ranges and restricts page sizes", () => {
    expect(
      expenseQuerySchema.safeParse({
        ...defaultExpenseQuery(),
        from: "2026-10-20",
        to: "2026-10-01",
      }).success,
    ).toBe(false);
    expect(
      expenseQuerySchema.parse({ ...defaultExpenseQuery(), page_size: 999 })
        .page_size,
    ).toBe(10);
  });
  it("clears a dependent cash link and amount when changing location or payment", () => {
    const draft = {
      ...input,
      cash_source: "REGISTER" as const,
      cash_movement_id: ids.cash,
    };
    expect(changeExpenseLocation(draft, "COMMISSARY")).toMatchObject({
      scope: "COMMISSARY",
      branch_id: null,
      cash_movement_id: null,
      amount: "",
      cash_source: "OTHER",
    });
    expect(changeExpensePayment(draft, "CARD")).toMatchObject({
      payment_method: "CARD",
      cash_source: null,
      cash_movement_id: null,
      amount: "",
    });
  });
  it("keeps a matching retry key but starts a new operation for changed input", () => {
    const attempt = operationKey(null, input, () => "first");
    expect(operationKey(attempt, { ...input }, () => "second")).toBe(attempt);
    expect(
      operationKey(attempt, { ...input, notes: "Corrected" }, () => "second")
        .key,
    ).toBe("second");
  });
});
