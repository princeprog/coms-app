import { beforeEach, describe, expect, it, vi } from "vitest";

const { request, revalidate } = vi.hoisted(() => ({
  request: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "coms_access=test" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidate }));
vi.mock("@/services/server-api-services", () => ({ requestComsApi: request }));

import { createBranchAction, updateBranchAction } from "./branch-actions";
const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const details = {
  branch_name: "Main Branch",
  address: null,
  date_opened: "2024-01-15",
  has_dine_in: true,
  has_takeaway: false,
};

describe("branch save contracts", () => {
  beforeEach(() => {
    request.mockReset();
    revalidate.mockReset();
  });

  it("updates a dine-in-only branch using the actual form payload", async () => {
    request.mockResolvedValue({
      id,
      ...details,
      code: "BR-001",
      status: "active",
    });
    expect(await updateBranchAction(id, details)).toEqual({ ok: true });
    expect(request).toHaveBeenCalledWith(
      `/branches/${id}`,
      expect.objectContaining({ method: "PATCH", body: details }),
    );
    expect(revalidate).toHaveBeenCalledWith("/branches");
  });

  it("creates a branch with an explicit Takeout setting", async () => {
    request.mockResolvedValue({
      id,
      ...details,
      code: "BR-001",
      status: "active",
    });
    expect(await createBranchAction(details)).toEqual({
      ok: true,
      code: "BR-001",
    });
    expect(request).toHaveBeenCalledWith(
      "/branches",
      expect.objectContaining({ method: "POST", body: details }),
    );
  });

  it("rejects a forged branch code before sending a request", async () => {
    expect(
      (await updateBranchAction(id, { ...details, code: "FORGED" })).ok,
    ).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });
});
