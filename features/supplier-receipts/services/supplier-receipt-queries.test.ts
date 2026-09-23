import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSupplierReceiptPageData } from "./supplier-receipt-queries";

const { requestComsApi } = vi.hoisted(() => ({ requestComsApi: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "coms_access=access-token" }),
}));
vi.mock("@/services/server-api-services", () => ({ requestComsApi }));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const timestamp = "2026-09-24T01:30:00.000Z";

describe("supplier receipt page queries", () => {
  beforeEach(() => requestComsApi.mockReset());

  it("loads a paginated receipt directory with search and status filters", async () => {
    requestComsApi.mockResolvedValue({
      items: [
        {
          id,
          supplier_id: id,
          supplier_name: "North Farm Supply",
          received_at: "2026-09-24",
          status: "DRAFT",
          idempotency_key: id,
          created_by_user_id: id,
          posted_by_user_id: null,
          posted_at: null,
          created_at: timestamp,
          updated_at: timestamp,
          total_cost: "33.625",
          item_count: 2,
        },
      ],
      total: 1,
      page: 2,
      page_size: 25,
    });

    await expect(
      getSupplierReceiptPageData({
        page: 2,
        search: " North Farm ",
        status: "DRAFT",
      }),
    ).resolves.toMatchObject({ total: 1, items: [{ total_cost: "33.625" }] });

    expect(requestComsApi).toHaveBeenCalledWith(
      "/supplier-receipts?page=2&page_size=25&search=North+Farm&status=DRAFT",
      { cookieHeader: "coms_access=access-token" },
    );
  });
});
