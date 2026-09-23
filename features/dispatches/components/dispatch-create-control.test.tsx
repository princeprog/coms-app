// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DispatchCreateControl } from "./dispatch-create-control";

const { push, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const requestId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const dispatchId = "9a7a91d1-9c7f-4f30-a61b-4bbd039408f9";
const idempotencyKey = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";

afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
  refresh.mockReset();
});

describe("dispatch create control", () => {
  it("creates a draft with an idempotency key and opens its detail page", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(idempotencyKey),
    });
    const action = vi.fn().mockResolvedValue({
      ok: true,
      dispatch_id: dispatchId,
    });
    render(
      <DispatchCreateControl stockRequestId={requestId} action={action} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Prepare dispatch" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(requestId, idempotencyKey),
    );
    expect(push).toHaveBeenCalledWith(`/dispatches/${dispatchId}`);
    expect(refresh).toHaveBeenCalled();
  });

  it("reuses the same retry key after an uncertain response", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(idempotencyKey),
    });
    const action = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: "Try again." })
      .mockResolvedValueOnce({ ok: true, dispatch_id: dispatchId });
    render(
      <DispatchCreateControl stockRequestId={requestId} action={action} />,
    );

    const button = screen.getByRole("button", { name: "Prepare dispatch" });
    fireEvent.click(button);
    await screen.findByRole("alert");
    fireEvent.click(button);

    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(action.mock.calls[0]).toEqual([requestId, idempotencyKey]);
    expect(action.mock.calls[1]).toEqual([requestId, idempotencyKey]);
  });

  it("links to the dispatch list after a workflow conflict", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(idempotencyKey),
    });
    const action = vi.fn().mockResolvedValue({
      ok: false,
      error: "The workflow changed. Refresh and try again.",
    });
    render(
      <DispatchCreateControl stockRequestId={requestId} action={action} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Prepare dispatch" }));

    expect(
      (
        await screen.findByRole("link", { name: "Review dispatches" })
      ).getAttribute("href"),
    ).toBe("/dispatches");
  });
});
