// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  Dispatch,
  DispatchDiscrepancyAction,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchDiscrepancyControl } from "./dispatch-discrepancy-control";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const key = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const dispatch: Dispatch = {
  id,
  stock_request_id: id,
  branch_id: id,
  branch_name: "Downtown",
  stock_request_status: "APPROVED",
  status: "PARTIALLY_RECEIVED",
  created_by_user_id: id,
  created_by_name: "Commissary Staff",
  dispatched_by_user_id: id,
  dispatched_by_name: "Commissary Staff",
  dispatched_at: "2026-09-24T01:30:00.000Z",
  created_at: "2026-09-24T01:30:00.000Z",
  updated_at: "2026-09-24T01:30:00.000Z",
  items: [],
  receipts: [],
  shortage_closures: [],
  events: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

describe("dispatch discrepancy controls", () => {
  it("requires and records the branch discrepancy note with an idempotency key", async () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue(key) });
    const user = userEvent.setup();
    const action = vi
      .fn<DispatchDiscrepancyAction>()
      .mockResolvedValue({ ok: true });
    render(
      <DispatchDiscrepancyControl
        dispatch={dispatch}
        mode="report"
        action={action}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Report discrepancy" }));
    await user.type(
      screen.getByLabelText("What was missing from the delivery?"),
      "20 units are still unaccounted for",
    );
    await user.click(screen.getByRole("button", { name: "Submit discrepancy" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(
        id,
        { note: "20 units are still unaccounted for" },
        key,
      ),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("uses a reasoned recount request without editing any receipt", async () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue(key) });
    const user = userEvent.setup();
    const action = vi
      .fn<DispatchDiscrepancyAction>()
      .mockResolvedValue({ ok: true });
    render(
      <DispatchDiscrepancyControl
        dispatch={dispatch}
        mode="recount"
        action={action}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Request recount" }));
    await user.type(
      screen.getByLabelText("Reason for recount"),
      "Please verify the remaining cartons",
    );
    await user.click(screen.getByRole("button", { name: "Send recount request" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(
        id,
        { reason: "Please verify the remaining cartons" },
        key,
      ),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
