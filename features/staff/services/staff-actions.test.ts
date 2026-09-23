import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock, requestComsApiMock, revalidatePathMock } = vi.hoisted(
  () => ({
    cookiesMock: vi.fn(async () => ({
      toString: (): string => "coms_access=test",
    })),
    requestComsApiMock: vi.fn(),
    revalidatePathMock: vi.fn(),
  }),
);

vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/services/server-api-services", () => ({
  requestComsApi: requestComsApiMock,
}));

import { ApiRequestError } from "@/services/api-services";
import {
  assignStaffBranchesAction,
  assignStaffRoleAction,
  createStaffAction,
  deactivateStaffAction,
  updateStaffAction,
} from "@/features/staff/services/staff-actions";

const staffId = "4b450453-7640-4719-990c-29e97b77e3e9";
const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("staff actions", () => {
  beforeEach(() => {
    requestComsApiMock.mockReset();
    requestComsApiMock.mockResolvedValue(undefined);
    revalidatePathMock.mockReset();
  });

  it("validates and creates staff through the server-only API client", async () => {
    await expect(
      createStaffAction({
        email: " Alex@Example.com ",
        full_name: " Alex Staff ",
        contact_number: " 09170000000 ",
        password: "a secure test password",
        role_id: "4",
        branch_ids: [branchId],
      }),
    ).resolves.toEqual({ ok: true });

    expect(requestComsApiMock).toHaveBeenCalledWith(
      "/staff",
      expect.objectContaining({
        method: "POST",
        cookieHeader: "coms_access=test",
        body: expect.objectContaining({
          email: "alex@example.com",
          full_name: "Alex Staff",
          contact_number: "09170000000",
          role_id: "4",
          branch_ids: [branchId],
        }),
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/staff");
  });

  it("sends a selected branch scope with profile and role mutations", async () => {
    await updateStaffAction(staffId, branchId, { full_name: "Alex Updated" });
    await assignStaffRoleAction(staffId, branchId, { role_id: "4" });

    expect(requestComsApiMock.mock.calls[0]?.[0]).toBe(
      `/staff/${staffId}?branch_id=${branchId}`,
    );
    expect(requestComsApiMock.mock.calls[1]?.[0]).toBe(
      `/staff/${staffId}/role?branch_id=${branchId}`,
    );
  });

  it("sends branch replacements with the selected scope and confirms deactivation", async () => {
    await assignStaffBranchesAction(staffId, branchId, {
      branch_ids: [branchId],
    });
    await deactivateStaffAction(staffId, branchId);

    expect(requestComsApiMock.mock.calls[0]?.[0]).toBe(
      `/staff/${staffId}/branches?branch_id=${branchId}`,
    );
    expect(requestComsApiMock.mock.calls[0]?.[1]).toMatchObject({
      method: "PUT",
      body: { branch_ids: [branchId] },
    });
    expect(requestComsApiMock.mock.calls[1]?.[0]).toBe(
      `/staff/${staffId}/deactivate?branch_id=${branchId}`,
    );
  });

  it("rejects invalid IDs locally and maps stale branch access errors", async () => {
    await expect(
      updateStaffAction("not-a-user-id", branchId, { full_name: "Alex" }),
    ).resolves.toMatchObject({ ok: false });
    expect(requestComsApiMock).not.toHaveBeenCalled();

    requestComsApiMock.mockRejectedValue(new ApiRequestError("Not found", 404));
    await expect(deactivateStaffAction(staffId, branchId)).resolves.toEqual({
      ok: false,
      error:
        "This staff account is no longer available in the selected branch.",
    });
  });
});
