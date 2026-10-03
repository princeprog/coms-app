// @vitest-environment jsdom

import {
  fireEvent,
  render as renderView,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DispatchCreateDialog } from "./dispatch-create-dialog";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("../services/dispatch-stock-actions", () => ({
  searchDispatchStock: async () => ({
    items: options.stockItems,
    total: 1,
    page: 1,
    page_size: 25,
    availabilityVisible: false,
  }),
}));
function render(ui: ReactNode) {
  return renderView(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {ui}
    </QueryClientProvider>,
  );
}

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
  it("reviews without mutation, reuses an uncertain retry key, and opens the sent dispatch", async () => {
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
    expect(screen.getByRole("dialog").getAttribute("data-slot")).toBe(
      "dialog-content",
    );
    await user.click(
      within(form).getByRole("button", { name: "Review & send" }),
    );
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(action).not.toHaveBeenCalled();

    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(
      await screen.findByRole("option", { name: "Banilad Branch" }),
    );
    await user.click(screen.getByRole("combobox", { name: "Stock item 1" }));
    await user.click(await screen.findByRole("option", { name: "Flour · kg" }));
    await user.type(screen.getByLabelText("Quantity (kg)"), "12.50");
    await user.click(
      within(form).getByRole("button", { name: "Review & send" }),
    );
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByText("12.50 kg")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Confirm dispatch" }));
    expect(await screen.findByText("Temporary failure.")).toBeTruthy();

    await user.click(
      within(form).getByRole("button", { name: "Confirm dispatch" }),
    );
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
    await user.click(
      await screen.findByRole("option", { name: "Banilad Branch" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.getByRole("alertdialog", { name: "Discard dispatch details?" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(
      screen.getByRole("combobox", { name: "Branch" }).textContent,
    ).toContain("Banilad Branch");
  });

  it("preserves reviewed values on Back and rotates the retry key after an edit", async () => {
    const user = userEvent.setup();
    const nextKey = "b34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
    vi.stubGlobal("crypto", {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce(retryKey)
        .mockReturnValueOnce(nextKey),
    });
    const action = vi
      .fn()
      .mockResolvedValue({ ok: false, error: "Stock is insufficient." });
    render(
      <DispatchCreateDialog
        canCreate
        options={options}
        optionsIssue={null}
        action={action}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Create dispatch" }));
    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(
      await screen.findByRole("option", { name: "Banilad Branch" }),
    );
    await user.click(screen.getByRole("combobox", { name: "Stock item 1" }));
    await user.click(await screen.findByRole("option", { name: "Flour · kg" }));
    await user.type(screen.getByLabelText("Quantity (kg)"), "12.50");
    await user.click(screen.getByRole("button", { name: "Review & send" }));
    await user.click(screen.getByRole("button", { name: "Confirm dispatch" }));
    await screen.findByText("Stock is insufficient.");
    await user.click(screen.getByRole("button", { name: "Back to edit" }));
    expect(screen.getByLabelText("Quantity (kg)")).toHaveProperty(
      "value",
      "12.50",
    );
    await user.clear(screen.getByLabelText("Quantity (kg)"));
    await user.type(screen.getByLabelText("Quantity (kg)"), "10.125");
    await user.click(screen.getByRole("button", { name: "Review & send" }));
    await user.click(screen.getByRole("button", { name: "Confirm dispatch" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(action.mock.calls[0][1]).toBe(retryKey);
    expect(action.mock.calls[1]).toEqual([
      {
        branch_id: branchId,
        items: [{ stock_item_id: stockItemId, quantity_dispatched: "10.125" }],
      },
      nextKey,
    ]);
  });

  it("routes Escape on a dirty dispatch through the discard guard", async () => {
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
    await user.click(
      await screen.findByRole("option", { name: "Banilad Branch" }),
    );
    await user.keyboard("{Escape}");

    expect(
      screen.getByRole("alertdialog", { name: "Discard dispatch details?" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(
      screen.getByRole("dialog", { name: "Create dispatch" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Branch" }).textContent,
    ).toContain("Banilad Branch");
  });
  it("closes a clean modal with Escape and restores focus to its trigger", async () => {
    const user = userEvent.setup();
    render(
      <DispatchCreateDialog
        canCreate
        options={options}
        optionsIssue={null}
        action={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Create dispatch" });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("describes recovery in the dialog when dispatch options cannot load", async () => {
    const user = userEvent.setup();
    render(
      <DispatchCreateDialog
        canCreate
        options={null}
        optionsIssue="unavailable"
        action={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create dispatch" }));
    expect(screen.getByRole("alert").textContent).toContain(
      "Close this dialog and refresh to try again.",
    );
  });

  it("keeps a dirty modal open behind its close confirmation and resets after discard", async () => {
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
    const dialog = screen.getByRole("dialog", { name: "Create dispatch" });
    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(
      await screen.findByRole("option", { name: "Banilad Branch" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Close Create dispatch" }),
    );

    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(
      document.querySelector(
        '[data-slot="dialog-content"][data-nested-dialog-open]',
      ),
    ).toBe(dialog);
    await user.click(screen.getByRole("button", { name: "Discard details" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await user.click(screen.getByRole("button", { name: "Create dispatch" }));
    expect(
      screen.getByRole("combobox", { name: "Branch" }).textContent,
    ).toContain("Select a branch");
  });

  it("blocks modal dismissal and repeat submission while sending", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue(retryKey) });
    let resolveAction: (value: {
      ok: true;
      dispatch_id: string;
    }) => void = () => {};
    const action = vi.fn(
      () =>
        new Promise<{ ok: true; dispatch_id: string }>((resolve) => {
          resolveAction = resolve;
        }),
    );
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
    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(
      await screen.findByRole("option", { name: "Banilad Branch" }),
    );
    await user.click(screen.getByRole("combobox", { name: "Stock item 1" }));
    await user.click(await screen.findByRole("option", { name: "Flour · kg" }));
    await user.type(screen.getByLabelText("Quantity (kg)"), "12.50");
    await user.click(
      within(form).getByRole("button", { name: "Review & send" }),
    );
    await user.click(
      within(form).getByRole("button", { name: "Confirm dispatch" }),
    );

    const closeButton = screen.getByRole("button", {
      name: "Close Create dispatch",
    });
    const submitButton = within(form).getByRole("button", {
      name: "Sending…",
    });
    expect(closeButton).toHaveProperty("disabled", true);
    expect(submitButton).toHaveProperty("disabled", true);
    fireEvent.submit(form);
    fireEvent.submit(form);
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("dialog", { name: "Create dispatch" }),
    ).toBeTruthy();
    expect(action).toHaveBeenCalledTimes(1);

    resolveAction({ ok: true, dispatch_id: dispatchId });
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(`/dispatches/${dispatchId}`),
    );
  });
});
