// @vitest-environment jsdom

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DispatchCreateDialog } from "./dispatch-create-dialog";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

if (!window.PointerEvent) {
  Object.defineProperty(window, "PointerEvent", {
    configurable: true,
    value: window.MouseEvent,
  });
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const stockItemId = "9a7a91d1-9c7f-4f30-a61b-4bbd039408f9";
const dispatchId = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const retryKey = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

const options = {
  branches: [
    {
      id: branchId,
      code: "BR-TEST",
      branch_name: "Banilad Branch",
      address: null,
      date_opened: null,
      has_dine_in: true,
      status: "active" as const,
    },
  ],
  stockItems: [
    {
      id: stockItemId,
      stock_item_name: "Flour",
      category: "Dry goods",
      unit: "kg",
      is_active: true,
      created_at: "2026-09-25T01:00:00.000Z",
      updated_at: "2026-09-25T01:00:00.000Z",
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  push.mockReset();
});

describe("direct dispatch creation", () => {
  it("validates, reuses an uncertain retry key, and navigates to the draft", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue(retryKey) });
    const action = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: "Temporary failure." })
      .mockResolvedValueOnce({ ok: true, dispatch_id: dispatchId });
    render(
      <DispatchCreateDialog
        canCreate
        options={options}
        optionsIssue={null}
        action={action}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create dispatch" }));
    const form = screen.getByRole("form", { name: "Create dispatch" });
    await user.click(within(form).getByRole("button", { name: "Create dispatch" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(action).not.toHaveBeenCalled();

    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(await screen.findByRole("option", { name: "Banilad Branch" }));
    await user.click(screen.getByRole("combobox", { name: "Stock item 1" }));
    await user.click(await screen.findByRole("option", { name: "Flour · kg" }));
    await user.type(screen.getByLabelText("Quantity (kg)"), "12.50");
    await user.click(within(form).getByRole("button", { name: "Create dispatch" }));
    expect(await screen.findByText("Temporary failure.")).toBeTruthy();

    await user.click(within(form).getByRole("button", { name: "Create dispatch" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(action.mock.calls[0]).toEqual([
      {
        branch_id: branchId,
        items: [{ stock_item_id: stockItemId, quantity_dispatched: "12.50" }],
      },
      retryKey,
    ]);
    expect(action.mock.calls[1][1]).toBe(retryKey);
    expect(push).toHaveBeenCalledWith(`/dispatches/${dispatchId}`);
  });

  it("asks before discarding a dirty dispatch and keeps the draft on cancel", async () => {
    const user = userEvent.setup();
    render(
      <DispatchCreateDialog
        canCreate
        options={options}
        optionsIssue={null}
        action={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create dispatch" }));
    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(await screen.findByRole("option", { name: "Banilad Branch" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.getByRole("alertdialog", { name: "Discard dispatch details?" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByRole("combobox", { name: "Branch" }).textContent).toContain(
      "Banilad Branch",
    );
  });
});
