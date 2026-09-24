import { describe, expect, it } from "vitest";

async function getReportSchemas() {
  return import("./daily-report.schema").catch(() => null);
}

describe("daily report schemas", () => {
  it("accepts exact decimal strings and a valid business date", async () => {
    const schemas = await getReportSchemas();
    expect(schemas).not.toBeNull();
    if (!schemas) return;

    expect(
      schemas.createDailyReportSchema.safeParse({
        business_date: "2026-09-23",
      }).success,
    ).toBe(true);
    expect(
      schemas.updateDailyReportSchema.safeParse({
        items: [
          {
            stock_item_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            physical_closing_quantity: "12.3400",
            waste_quantity: "0.250",
            waste_reason: "Damaged during prep",
            adjustment_quantity: "-0.1",
            adjustment_reason: "Count correction",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("requires reasons for nonzero waste and adjustments", async () => {
    const schemas = await getReportSchemas();
    expect(schemas).not.toBeNull();
    if (!schemas) return;

    const item = {
      stock_item_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      physical_closing_quantity: "0",
      waste_quantity: "1",
      adjustment_quantity: "-1",
    };
    expect(
      schemas.updateDailyReportSchema.safeParse({ items: [item] }).success,
    ).toBe(false);
    expect(
      schemas.updateDailyReportSchema.safeParse({
        items: [
          {
            ...item,
            waste_reason: "breakage",
            adjustment_reason: "count correction",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects floating point numbers, duplicate items, and invalid calendar dates", async () => {
    const schemas = await getReportSchemas();
    expect(schemas).not.toBeNull();
    if (!schemas) return;

    const item = {
      stock_item_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      physical_closing_quantity: "1",
      waste_quantity: "0",
      adjustment_quantity: "0",
    };
    expect(
      schemas.createDailyReportSchema.safeParse({
        business_date: "2026-02-30",
      }).success,
    ).toBe(false);
    expect(
      schemas.updateDailyReportSchema.safeParse({
        items: [
          { ...item, physical_closing_quantity: 1 },
          { ...item, stock_item_id: "3fa85f64-5717-4562-b3fc-2c963f66afa7" },
        ],
      }).success,
    ).toBe(false);
    expect(
      schemas.updateDailyReportSchema.safeParse({
        items: [item, item],
      }).success,
    ).toBe(false);
  });
});
