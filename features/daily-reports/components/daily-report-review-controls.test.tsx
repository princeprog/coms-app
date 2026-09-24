// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

async function getReviewControls() {
  return import(/* @vite-ignore */ "./daily-report-review-controls").catch(
    () => null,
  );
}

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const reportId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const report = {
  id: reportId,
  branch_id: branchId,
  business_date: "2026-09-23",
  status: "SUBMITTED" as const,
  idempotency_key: reportId,
  created_by_user_id: reportId,
  submitted_by_user_id: reportId,
  submitted_at: "2026-09-24T02:00:00.000Z",
  reviewed_by_user_id: null,
  reviewed_at: null,
  return_reason: null,
  created_at: "2026-09-24T02:00:00.000Z",
  updated_at: "2026-09-24T02:00:00.000Z",
  items: [],
  events: [],
};

describe("daily report review controls", () => {
  it("blocks status changes while count edits are unsaved", async () => {
    const controlsModule = await getReviewControls();
    expect(controlsModule).not.toBeNull();
    if (!controlsModule) return;
    const DailyReportReviewControls = controlsModule.DailyReportReviewControls;
    const action = vi.fn().mockResolvedValue({
      ok: true,
      report: { ...report, status: "SUBMITTED" },
    });
    function Harness() {
      return (
        <DailyReportReviewControls
          branchId={branchId}
          report={{ ...report, status: "DRAFT" }}
          canSubmit
          canReturn={false}
          canApprove={false}
          hasUnsavedChanges
          submitAction={action}
          returnAction={vi.fn()}
          approveAction={vi.fn()}
          onReportChange={vi.fn()}
        />
      );
    }
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByText(/save or discard unsaved counts/i)).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Submit for review" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(action).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(action).not.toHaveBeenCalled();
  });

  it("updates the report from the API response after submission", async () => {
    const controlsModule = await getReviewControls();
    expect(controlsModule).not.toBeNull();
    if (!controlsModule) return;
    const submitted = { ...report, status: "SUBMITTED" as const };
    const action = vi.fn().mockResolvedValue({ ok: true, report: submitted });
    const onReportChange = vi.fn();
    const user = userEvent.setup();
    render(
      <controlsModule.DailyReportReviewControls
        branchId={branchId}
        report={{ ...report, status: "DRAFT" }}
        canSubmit
        canReturn={false}
        canApprove={false}
        hasUnsavedChanges={false}
        submitAction={action}
        returnAction={vi.fn()}
        approveAction={vi.fn()}
        onReportChange={onReportChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Submit for review" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(branchId, reportId),
    );
    expect(onReportChange).toHaveBeenCalledWith(submitted);
  });

  it("requires a reason before returning a submitted report", async () => {
    const controlsModule = await getReviewControls();
    expect(controlsModule).not.toBeNull();
    if (!controlsModule) return;
    const returnAction = vi.fn().mockResolvedValue({
      ok: true,
      report: {
        ...report,
        status: "RETURNED",
        return_reason: "Count this again",
      },
    });
    const user = userEvent.setup();
    render(
      <controlsModule.DailyReportReviewControls
        branchId={branchId}
        report={report}
        canSubmit={false}
        canReturn
        canApprove={false}
        hasUnsavedChanges={false}
        submitAction={vi.fn()}
        returnAction={returnAction}
        approveAction={vi.fn()}
        onReportChange={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Return for correction" }),
    );
    expect(
      screen
        .getByRole("button", { name: "Confirm return" })
        .hasAttribute("disabled"),
    ).toBe(true);
    await user.type(
      screen.getByLabelText("Reason for return"),
      "Count this again",
    );
    await user.click(screen.getByRole("button", { name: "Confirm return" }));

    await waitFor(() =>
      expect(returnAction).toHaveBeenCalledWith(branchId, reportId, {
        reason: "Count this again",
      }),
    );
  });

  it("asks for explicit confirmation before approval changes inventory", async () => {
    const controlsModule = await getReviewControls();
    expect(controlsModule).not.toBeNull();
    if (!controlsModule) return;
    const approveAction = vi.fn().mockResolvedValue({
      ok: true,
      report: { ...report, status: "APPROVED" },
    });
    const user = userEvent.setup();
    render(
      <controlsModule.DailyReportReviewControls
        branchId={branchId}
        report={report}
        canSubmit={false}
        canReturn={false}
        canApprove
        hasUnsavedChanges={false}
        submitAction={vi.fn()}
        returnAction={vi.fn()}
        approveAction={approveAction}
        onReportChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Approve report" }));
    expect(
      screen.getByText(/approval reconciles the physical count/i),
    ).toBeTruthy();
    expect(approveAction).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Approve and reconcile" }),
    );

    await waitFor(() =>
      expect(approveAction).toHaveBeenCalledWith(branchId, reportId),
    );
  });
});
