import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookies, requestComsApi } = vi.hoisted(() => ({
  cookies: vi.fn(),
  requestComsApi: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies }));
vi.mock("@/services/server-api-services", () => ({ requestComsApi }));

async function getQueries() {
  return import("./daily-report-queries").catch(() => null);
}

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const reportId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";

describe("daily report queries", () => {
  beforeEach(() => {
    cookies.mockResolvedValue({ toString: () => "coms_access=access-token" });
    requestComsApi.mockReset();
  });

  it("loads a validated status-filtered branch report page", async () => {
    const queries = await getQueries();
    expect(queries).not.toBeNull();
    if (!queries) return;
    requestComsApi.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      page_size: 25,
    });

    await expect(
      queries.getDailyReportPageData({
        branchId,
        page: 2,
        status: "SUBMITTED",
      }),
    ).resolves.toEqual({ items: [], total: 0, page: 2, page_size: 25 });
    expect(requestComsApi).toHaveBeenCalledWith(
      `/branches/${branchId}/daily-reports?page=2&page_size=25&status=SUBMITTED`,
      { cookieHeader: "coms_access=access-token" },
    );
  });

  it("rejects malformed branch IDs before making an API request", async () => {
    const queries = await getQueries();
    expect(queries).not.toBeNull();
    if (!queries) return;

    await expect(
      queries.getDailyReportPageData({ branchId: "bad", page: 1 }),
    ).rejects.toMatchObject({ status: 404 });
    expect(requestComsApi).not.toHaveBeenCalled();
  });

  it("loads a validated report detail through its selected branch endpoint", async () => {
    const queries = await getQueries();
    expect(queries).not.toBeNull();
    if (!queries) return;
    const report = {
      id: reportId,
      branch_id: branchId,
      business_date: "2026-09-23",
      status: "DRAFT",
      idempotency_key: reportId,
      created_by_user_id: reportId,
      submitted_by_user_id: null,
      submitted_at: null,
      reviewed_by_user_id: null,
      reviewed_at: null,
      return_reason: null,
      created_at: "2026-09-24T02:00:00.000Z",
      updated_at: "2026-09-24T02:00:00.000Z",
      items: [],
      events: [],
    };
    requestComsApi.mockResolvedValue(report);

    await expect(
      queries.getDailyReportDetail(branchId, reportId),
    ).resolves.toEqual(report);
    expect(requestComsApi).toHaveBeenCalledWith(
      `/branches/${branchId}/daily-reports/${reportId}`,
      { cookieHeader: "coms_access=access-token" },
    );
  });
});
