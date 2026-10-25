// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScheduledShiftNote } from "./scheduled-shift-note";
import { ShiftTemplateDialog } from "./shift-template-dialog";

const mocks = vi.hoisted(() => ({ getMyScheduleAction: vi.fn() }));
vi.mock("../services/schedule-actions", () => ({
  getMyScheduleAction: mocks.getMyScheduleAction,
  saveShiftTemplateAction: vi.fn(),
}));

const branch = "40000000-0000-4000-8000-000000000001";
const other = "40000000-0000-4000-8000-000000000002";

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function shift(
  branchId: string,
  startOffsetMinutes: number,
  lengthMinutes = 480,
) {
  const start = new Date(Date.now() + startOffsetMinutes * 60_000);
  return {
    work_date: "2026-10-25",
    branch_id: branchId,
    branch_name: "Ermita",
    template_id: "10000000-0000-4000-8000-000000000001",
    template_name: "Morning",
    start_time: "06:00",
    end_time: "14:00",
    starts_at: start.toISOString(),
    ends_at: new Date(+start + lengthMinutes * 60_000).toISOString(),
    source: "PATTERN" as const,
  };
}

describe("scheduled shift note", () => {
  beforeEach(() => mocks.getMyScheduleAction.mockReset());

  it("confirms a shift that is running now", async () => {
    mocks.getMyScheduleAction.mockResolvedValue({
      ok: true,
      data: {
        business_today: "2026-10-25",
        days: 14,
        shifts: [shift(branch, -60)],
      },
    });
    render(wrap(<ScheduledShiftNote branchId={branch} />));
    expect(await screen.findByText(/You're scheduled for/)).toBeTruthy();
    expect(screen.getByText("Morning")).toBeTruthy();
  });

  it("warns when the person is not scheduled at this branch", async () => {
    mocks.getMyScheduleAction.mockResolvedValue({
      ok: true,
      data: {
        business_today: "2026-10-25",
        days: 14,
        shifts: [shift(other, -60)],
      },
    });
    render(wrap(<ScheduledShiftNote branchId={branch} />));
    expect(
      await screen.findByText(/not on the schedule here right now/),
    ).toBeTruthy();
  });

  it("stays quiet for people without a schedule", async () => {
    mocks.getMyScheduleAction.mockResolvedValue({
      ok: true,
      data: { business_today: "2026-10-25", days: 14, shifts: [] },
    });
    const { container } = render(
      wrap(<ScheduledShiftNote branchId={branch} />),
    );
    await vi.waitFor(() =>
      expect(mocks.getMyScheduleAction).toHaveBeenCalled(),
    );
    expect(container.textContent).toBe("");
  });
});

describe("shift template dialog", () => {
  it("explains when a shift would run past the business day start", () => {
    render(
      <ShiftTemplateDialog
        branchId={branch}
        template={{
          id: "10000000-0000-4000-8000-000000000009",
          branch_id: branch,
          name: "Night",
          start_time: "22:00",
          end_time: "06:00",
          weekdays: [1, 2, 3, 4, 5, 6, 7],
          is_active: true,
          revision: 1,
          staff_count: 0,
        }}
        dayStartTimes={["00:00"]}
        onClose={() => {}}
        onSaved={() => {}}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "runs past the business day start (12:00 AM)",
    );
    expect(screen.getByText(/ends the next day/)).toBeTruthy();
  });
});
