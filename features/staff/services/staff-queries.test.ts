import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, requestComsApiMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(async () => ({
    toString: (): string => "coms_access=test",
  })),
  requestComsApiMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("@/services/server-api-services", () => ({
  requestComsApi: requestComsApiMock,
}));

import { ApiRequestError } from "@/services/api-services";
import { getStaffPageData } from "@/features/staff/services/staff-queries";

const staffPage = {
  items: [
    {
      id: "4b450453-7640-4719-990c-29e97b77e3e9",
      email: "alex@example.com",
      full_name: "Alex Staff",
      contact_number: "09170000000",
      is_active: true,
      role_id: "4",
      role_code: "BRANCH_MANAGER",
      role_name: "Branch Manager",
      branch_ids: ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    },
  ],
  total: 1,
  page: 2,
  page_size: 25,
};

describe("staff queries", () => {
  beforeEach(() => requestComsApiMock.mockReset());

  it("requests and validates one branch-scoped staff page", async () => {
    requestComsApiMock.mockResolvedValue(staffPage);

    await expect(
      getStaffPageData({
        page: 2,
        pageSize: 25,
        search: "Alex Staff",
        branchId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      }),
    ).resolves.toMatchObject({ total: 1, page: 2 });

    const endpoint = requestComsApiMock.mock.calls[0]?.[0] as string;
    const url = new URL(endpoint, "https://coms.test");
    expect(url.pathname).toBe("/staff");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("page_size")).toBe("25");
    expect(url.searchParams.get("search")).toBe("Alex Staff");
    expect(url.searchParams.get("branch_id")).toBe(
      "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    );
    expect(requestComsApiMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ cookieHeader: "coms_access=test" }),
    );
  });

  it("rejects malformed API pages instead of rendering unchecked data", async () => {
    requestComsApiMock.mockResolvedValue({ items: [{ id: "bad" }] });

    const request = getStaffPageData({ page: 1, pageSize: 25 });
    await expect(request).rejects.toBeInstanceOf(ApiRequestError);
    await expect(request).rejects.toHaveProperty("status", 502);
  });
});
