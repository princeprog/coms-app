import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUserFromServer, revalidatePath, requestComsApi } = vi.hoisted(
  () => ({
    getCurrentUserFromServer: vi.fn(),
    revalidatePath: vi.fn(),
    requestComsApi: vi.fn(),
  }),
);

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "coms_access=access-token" }),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/features/auth/services/auth-server", () => ({
  getCurrentUserFromServer,
}));
vi.mock("@/services/server-api-services", () => ({ requestComsApi }));

async function getActions() {
  return import("./daily-report-actions").catch(() => null);
}

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const otherBranchId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const reportId = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const idempotencyKey = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const report = {
  id: reportId,
  branch_id: branchId,
  business_date: "2026-09-23",
  status: "DRAFT",
  idempotency_key: idempotencyKey,
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

function authenticated(
  permissions: string[],
  branchIds: string[] = [branchId],
) {
  return {
    status: "authenticated",
    user: {
      id: reportId,
      email: "staff@example.com",
      full_name: "Branch Staff",
      contact_number: "",
      role: {
        id: "1",
        code: "BRANCH_STAFF",
        name: "Branch Staff",
        isSystem: false,
        isActive: true,
      },
      permissions,
      branch_ids: branchIds,
    },
  };
}

describe("daily report server actions", () => {
  beforeEach(() => {
    getCurrentUserFromServer.mockReset();
    revalidatePath.mockReset();
    requestComsApi.mockReset();
  });

  it("creates a report with a UUID idempotency key and validates the response", async () => {
    const actions = await getActions();
    expect(actions).not.toBeNull();
    if (!actions) return;
    getCurrentUserFromServer.mockResolvedValue(
      authenticated(["daily_reports.create"]),
    );
    requestComsApi.mockResolvedValue(report);

    await expect(
      actions.createDailyReportAction(
        branchId,
        { business_date: "2026-09-23" },
        idempotencyKey,
      ),
    ).resolves.toEqual({ ok: true, report });
    expect(requestComsApi).toHaveBeenCalledWith(
      `/branches/${branchId}/daily-reports`,
      {
        cookieHeader: "coms_access=access-token",
        method: "POST",
        body: { business_date: "2026-09-23" },
        headers: { "Idempotency-Key": idempotencyKey },
      },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/reports");
  });

  it("rejects malformed report inputs before reading the session", async () => {
    const actions = await getActions();
    expect(actions).not.toBeNull();
    if (!actions) return;

    await expect(
      actions.createDailyReportAction(
        branchId,
        { business_date: "bad" },
        "bad",
      ),
    ).resolves.toMatchObject({ ok: false });
    expect(getCurrentUserFromServer).not.toHaveBeenCalled();
    expect(requestComsApi).not.toHaveBeenCalled();
  });

  it("does not submit a report for a branch outside the session scope", async () => {
    const actions = await getActions();
    expect(actions).not.toBeNull();
    if (!actions) return;
    getCurrentUserFromServer.mockResolvedValue(
      authenticated(["daily_reports.submit"], [otherBranchId]),
    );

    await expect(
      actions.submitDailyReportAction(branchId, reportId),
    ).resolves.toMatchObject({ ok: false });
    expect(requestComsApi).not.toHaveBeenCalled();
  });

  it("saves decimal-string counts and reasoned waste through the protected API", async () => {
    const actions = await getActions();
    expect(actions).not.toBeNull();
    if (!actions) return;
    getCurrentUserFromServer.mockResolvedValue(
      authenticated(["daily_reports.update"]),
    );
    requestComsApi.mockResolvedValue(report);
    const input = {
      items: [
        {
          stock_item_id: otherBranchId,
          physical_closing_quantity: "12.340",
          waste_quantity: "0.25",
          waste_reason: "Damaged packaging",
          adjustment_quantity: "0",
        },
      ],
    };

    await expect(
      actions.updateDailyReportAction(branchId, reportId, input),
    ).resolves.toEqual({ ok: true, report });
    expect(requestComsApi).toHaveBeenCalledWith(
      `/branches/${branchId}/daily-reports/${reportId}`,
      {
        cookieHeader: "coms_access=access-token",
        method: "PUT",
        body: input,
      },
    );
  });

  it("posts an explicit approval transition and refreshes inventory", async () => {
    const actions = await getActions();
    expect(actions).not.toBeNull();
    if (!actions) return;
    getCurrentUserFromServer.mockResolvedValue(
      authenticated(["daily_reports.approve"]),
    );
    requestComsApi.mockResolvedValue({ ...report, status: "APPROVED" });

    await expect(
      actions.approveDailyReportAction(branchId, reportId),
    ).resolves.toEqual({ ok: true, report: { ...report, status: "APPROVED" } });
    expect(requestComsApi).toHaveBeenCalledWith(
      `/branches/${branchId}/daily-reports/${reportId}/approve`,
      { cookieHeader: "coms_access=access-token", method: "POST" },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/reports");
    expect(revalidatePath).toHaveBeenCalledWith("/inventory");
  });

  it("treats an already approved report as a successful retried submission", async () => {
    const actions = await getActions();
    expect(actions).not.toBeNull();
    if (!actions) return;
    getCurrentUserFromServer.mockResolvedValue(
      authenticated(["daily_reports.submit"]),
    );
    requestComsApi.mockResolvedValue({ ...report, status: "APPROVED" });

    await expect(
      actions.submitDailyReportAction(branchId, reportId),
    ).resolves.toEqual({ ok: true, report: { ...report, status: "APPROVED" } });
  });

  it("requires a nonempty reason before returning a submitted report", async () => {
    const actions = await getActions();
    expect(actions).not.toBeNull();
    if (!actions) return;
    getCurrentUserFromServer.mockResolvedValue(
      authenticated(["daily_reports.return"]),
    );

    await expect(
      actions.returnDailyReportAction(branchId, reportId, { reason: "  " }),
    ).resolves.toMatchObject({ ok: false });
    expect(requestComsApi).not.toHaveBeenCalled();
  });
});
