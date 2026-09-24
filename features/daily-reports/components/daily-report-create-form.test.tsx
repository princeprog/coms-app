// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { refresh, replace } = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, replace }) }));

async function getCreateForm() {
  return import(/* @vite-ignore */ "./daily-report-create-form").catch(
    () => null,
  );
}

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const reportId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const firstKey = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const secondKey = "20e44ac1-cf09-4f85-8e10-1ac05ba3b785";
const report = {
  id: reportId,
  branch_id: branchId,
  business_date: "2026-09-23",
  status: "DRAFT",
  idempotency_key: firstKey,
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

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
  replace.mockReset();
});

describe("daily report create form", () => {
  it("rejects a date after today's Manila business date", async () => {
    const createFormModule = await getCreateForm();
    expect(createFormModule).not.toBeNull();
    if (!createFormModule) return;
    const action = vi.fn();
    const user = userEvent.setup();
    render(
      <createFormModule.DailyReportCreateForm
        branchId={branchId}
        todayManila="2026-09-24"
        action={action}
      />,
    );

    fireEvent.change(screen.getByLabelText("Business date"), {
      target: { value: "2026-09-25" },
    });
    await user.click(screen.getByRole("button", { name: "Create draft" }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/future/i);
    expect(action).not.toHaveBeenCalled();
  });

  it("reuses the idempotency key for retries with an unchanged date", async () => {
    const createFormModule = await getCreateForm();
    expect(createFormModule).not.toBeNull();
    if (!createFormModule) return;
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(firstKey),
    });
    const action = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: "Try again." })
      .mockResolvedValueOnce({ ok: true, report });
    const user = userEvent.setup();
    render(
      <createFormModule.DailyReportCreateForm
        branchId={branchId}
        todayManila="2026-09-24"
        action={action}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create draft" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Try again.");
    await user.click(screen.getByRole("button", { name: "Create draft" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(action).toHaveBeenNthCalledWith(
      1,
      branchId,
      { business_date: "2026-09-24" },
      firstKey,
    );
    expect(action).toHaveBeenNthCalledWith(
      2,
      branchId,
      { business_date: "2026-09-24" },
      firstKey,
    );
    expect(replace).toHaveBeenCalledWith(
      `/reports?branch_id=${branchId}&report_id=${reportId}`,
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("rotates the key when the business date changes after a failed attempt", async () => {
    const createFormModule = await getCreateForm();
    expect(createFormModule).not.toBeNull();
    if (!createFormModule) return;
    vi.stubGlobal("crypto", {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce(firstKey)
        .mockReturnValueOnce(secondKey),
    });
    const action = vi
      .fn()
      .mockResolvedValue({ ok: false, error: "Date already has a report." });
    const user = userEvent.setup();
    render(
      <createFormModule.DailyReportCreateForm
        branchId={branchId}
        todayManila="2026-09-24"
        action={action}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create draft" }));
    await user.clear(screen.getByLabelText("Business date"));
    await user.type(screen.getByLabelText("Business date"), "2026-09-23");
    await user.click(screen.getByRole("button", { name: "Create draft" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(action.mock.calls[0]?.[2]).toBe(firstKey);
    expect(action.mock.calls[1]?.[2]).toBe(secondKey);
  });
});
