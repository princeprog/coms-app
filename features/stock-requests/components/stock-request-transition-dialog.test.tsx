// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StockRequestTransitionAction } from "@/features/stock-requests/types/stock-request.types";
import { StockRequestTransitionDialog } from "./stock-request-transition-dialog";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const requestId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("stock request transition dialog", () => {
  beforeEach(() => refresh.mockReset());

  it("confirms a rejection without requesting a reason", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<StockRequestTransitionAction>()
      .mockResolvedValue({ ok: true });
    render(
      <StockRequestTransitionDialog
        requestId={requestId}
        transition="reject"
        action={action}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reject request" }));
    expect(
      screen.getByRole("heading", { name: "Reject stock request?" }),
    ).toBeTruthy();
    expect(screen.queryByLabelText(/reason/i)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Confirm rejection" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(requestId, "reject"),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("keeps the confirmation open and announces an API conflict", async () => {
    const user = userEvent.setup();
    const action = vi.fn<StockRequestTransitionAction>().mockResolvedValue({
      ok: false,
      error: "This request is no longer pending.",
    });
    render(
      <StockRequestTransitionDialog
        requestId={requestId}
        transition="approve"
        action={action}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Approve request" }));
    await user.click(screen.getByRole("button", { name: "Confirm approval" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "no longer pending",
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
  });
});
