// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DispatchPostControl } from "./dispatch-post-control";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const dispatchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const idempotencyKey = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

describe("dispatch post control", () => {
  it("requires confirmation before posting and refreshes after success", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(idempotencyKey),
    });
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(<DispatchPostControl dispatchId={dispatchId} action={action} />);

    await user.click(screen.getByRole("button", { name: "Post dispatch" }));
    expect(action).not.toHaveBeenCalled();
    expect(
      screen.getByText(/reduce commissary stock and begin branch transit/i),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Confirm dispatch" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(dispatchId, idempotencyKey),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("reuses the retry key when a post attempt returns an error", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(idempotencyKey),
    });
    const user = userEvent.setup();
    const action = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: "Try again." })
      .mockResolvedValueOnce({ ok: true });
    render(<DispatchPostControl dispatchId={dispatchId} action={action} />);

    await user.click(screen.getByRole("button", { name: "Post dispatch" }));
    await user.click(screen.getByRole("button", { name: "Confirm dispatch" }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Confirm dispatch" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(action.mock.calls[0]).toEqual([dispatchId, idempotencyKey]);
    expect(action.mock.calls[1]).toEqual([dispatchId, idempotencyKey]);
  });
});
