import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";
import { getSaleDetailData, getSalePageData } from "./sales-queries";

const { cookies, requestComsApi } = vi.hoisted(() => ({
  cookies: vi.fn(),
  requestComsApi: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies }));
vi.mock("server-only", () => ({}));
vi.mock("@/services/server-api-services", () => ({ requestComsApi }));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const saleId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const timestamp = "2026-09-24T01:30:00.000Z";
const sale = {
  id: saleId,
  branch_id: branchId,
  cashier_user_id: branchId,
  status: "COMPLETED",
  tender_method: "cash",
  total_amount: "12.50",
  idempotency_key: "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a",
  created_at: timestamp,
};

describe("sales queries", () => {
  beforeEach(() => {
    cookies.mockReset().mockResolvedValue({
      toString: () => "coms_access=abc",
    });
    requestComsApi.mockReset().mockResolvedValue({
      items: [{ ...sale, cashier_name: "Cashier" }],
      total: 1,
      page: 2,
      page_size: 25,
    });
  });

  it("loads a paginated branch sale history with the session cookie", async () => {
    await expect(getSalePageData({ branchId, page: 2 })).resolves.toMatchObject(
      { items: [{ total_amount: "12.50" }], page: 2 },
    );
    expect(requestComsApi).toHaveBeenCalledWith(
      `/branches/${branchId}/sales?page=2&page_size=25`,
      { cookieHeader: "coms_access=abc" },
    );
  });

  it("loads a sale detail and rejects invalid IDs or malformed API data", async () => {
    requestComsApi.mockResolvedValueOnce({
      ...sale,
      items: [],
      events: [],
    });
    await expect(getSaleDetailData(branchId, saleId)).resolves.toMatchObject({
      id: saleId,
      items: [],
    });
    expect(requestComsApi).toHaveBeenLastCalledWith(
      `/branches/${branchId}/sales/${saleId}`,
      { cookieHeader: "coms_access=abc" },
    );

    await expect(getSaleDetailData("invalid", saleId)).rejects.toMatchObject({
      status: 404,
    });
    requestComsApi.mockResolvedValueOnce({ ...sale, items: [] });
    await expect(getSaleDetailData(branchId, saleId)).rejects.toBeInstanceOf(
      ApiRequestError,
    );
  });
});
