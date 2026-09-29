import { describe, expect, it } from "vitest";
import { calculateSupplierReceiptTotal } from "./supplier-receipt-total";

const supplierId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const stockItemId = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";

describe("calculateSupplierReceiptTotal", () => {
  it("sums decimal line totals without floating point rounding", () => {
    expect(
      calculateSupplierReceiptTotal({
        supplier_id: supplierId,
        received_at: "2026-09-29",
        items: [
          {
            stock_item_id: stockItemId,
            quantity_received: "0.1",
            unit_cost: "0.2",
          },
          {
            stock_item_id: "9a153fa9-135f-4bd0-9f25-43a9617c9e0a",
            quantity_received: "1.5",
            unit_cost: "0.1",
          },
        ],
      }),
    ).toBe("0.17");
  });
});
