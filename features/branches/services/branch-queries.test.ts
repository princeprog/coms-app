import { beforeEach, describe, expect, it, vi } from "vitest";
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "coms_access=test" }),
}));
vi.mock("@/services/server-api-services", () => ({ requestComsApi: request }));
import { getBranchPageData } from "./branch-queries";
const page = { items: [], total: 0, page: 1, page_size: 8 };
describe("branch directory data", () => {
  beforeEach(() => request.mockResolvedValue(page));
  it("sends combined filters, date sorting and pagination to the backend", async () => {
    await getBranchPageData(2, "Main", {
      page: 2,
      search: "Main",
      status: "active",
      service_type: "TAKEAWAY",
      sort: "opened_desc",
    });
    const url = new URL(request.mock.lastCall![0], "https://example.test");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: "2",
      page_size: "8",
      search: "Main",
      status: "active",
      service_type: "TAKEAWAY",
      sort_by: "date_opened",
      sort_order: "desc",
    });
  });
  it("keeps existing branch lookups on their original page size", async () => {
    await getBranchPageData(1, "Market");
    expect(request.mock.lastCall![0]).toBe(
      "/branches?page=1&page_size=25&search=Market",
    );
  });
});
