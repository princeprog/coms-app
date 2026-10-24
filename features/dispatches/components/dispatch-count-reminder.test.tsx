// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { DispatchCountReminder } from "./dispatch-count-reminder";
const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  refresh: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("../services/count-reminder-action", () => ({
  sendCountReminderAction: mocks.send,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/components/ui/toast", () => ({ toast: { add: mocks.toast } }));
const dispatch = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  branch_name: "Cebu",
  receiving_status: "AWAITING_COUNT" as const,
  count_reminder: { last_sent_at: null, next_allowed_at: null },
};
function show(value = dispatch, allowed = true) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <DispatchCountReminder dispatch={value} allowed={allowed} />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  vi.useRealTimers();
});
describe("count reminders", () => {
  it("hides reminders without permission or compatible API metadata", () => {
    const view = show(dispatch, false);
    expect(screen.queryByRole("button")).toBeNull();
    view.unmount();
    render(
      <DispatchCountReminder
        dispatch={{ ...dispatch, count_reminder: undefined }}
        allowed
      />,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("hides the action after a count is posted or awaiting review", () => {
    for (const status of ["COUNTED", "REVIEW", "NONE"] as const) {
      const view = render(
        <DispatchCountReminder
          dispatch={{ ...dispatch, receiving_status: status }}
          allowed
        />,
      );
      expect(screen.queryByRole("button")).toBeNull();
      view.unmount();
    }
  });
  it("preserves the retry key after an uncertain failure and starts cooldown on success", async () => {
    const user = userEvent.setup();
    mocks.send
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        error: "Temporary outage",
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          last_sent_at: new Date().toISOString(),
          next_allowed_at: new Date(Date.now() + 1800000).toISOString(),
        },
      });
    show();
    await user.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith({
        type: "error",
        title: "Temporary outage",
      }),
    );
    await user.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true),
    );
    expect(mocks.send.mock.calls[0][1]).toBe(mocks.send.mock.calls[1][1]);
    expect(screen.getByText(/Last reminded/)).toBeTruthy();
    expect(screen.getByText(/Available again/)).toBeTruthy();
  });
  it("blocks duplicate clicks while the request is pending", async () => {
    const user = userEvent.setup();
    let finish!: (value: unknown) => void;
    mocks.send.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    show();
    await user.dblClick(screen.getByRole("button"));
    expect(
      screen
        .getByRole("button", { name: "Sending reminder…" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    await act(async () =>
      finish({ ok: false, status: 503, error: "Temporary outage" }),
    );
  });
});
