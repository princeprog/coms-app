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
const { getRestockSuggestions } = vi.hoisted(() => ({
  getRestockSuggestions: vi.fn(async (): Promise<unknown[]> => []),
}));
vi.mock("../services/dispatch-restock-actions", () => ({
  getRestockSuggestions,
}));
vi.mock("../services/dispatch-stock-actions", () => ({
  searchDispatchStock: async () => ({
    items: options.stockItems,
    total: 1,
    page: 1,
    page_size: 25,
    availabilityVisible: true,
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
      quantity_on_hand: "12.50",
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
  it("adds suggested restock lines for the chosen branch", async () => {
    const user = userEvent.setup();
    getRestockSuggestions.mockResolvedValueOnce([
      {
        stock_item_id: stockItemId,
        stock_item_name: "Flour",
        unit: "kg",
        on_hand: "2",
        on_the_way: "0",
        reorder_level: "5",
        target_level: "20",
        suggested_quantity: "18",
        quantity_to_send: "12.5",
        commissary_available: "12.5",
      },
      {
        stock_item_id: "0b1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d",
        stock_item_name: "Rice",
        unit: "kg",
        on_hand: "-1",
        on_the_way: "0",
        reorder_level: "2",
        target_level: "10",
        suggested_quantity: "11",
        quantity_to_send: "0",
        commissary_available: "0",
      },
    ]);
    render(
      <DispatchCreateDialog
        canCreate
        options={{ ...options, availabilityVisible: true }}
        optionsIssue={null}
        action={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Create dispatch" }));
    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(
      await screen.findByRole("option", { name: "Banilad Branch" }),
    );

    expect(
      await screen.findByText("2 items need restocking at Banilad Branch"),
    ).toBeTruthy();
    expect(getRestockSuggestions).toHaveBeenCalledWith(branchId);
    expect(screen.getByText("Not enough at commissary: Rice")).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Add 1 suggested item" }),
    );

    expect(screen.getByLabelText("Quantity (kg)")).toHaveProperty(
      "value",
      "12.5",
    );
    expect(
      screen.getByText(
        "Suggested 18 kg · on hand 2 · target 20 · only 12.5 at commissary",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("All suggested items are on this dispatch."),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("combobox", { name: /^Stock item/ }),
    ).toHaveLength(1);
  });

  it("keeps an over-stock quantity in entry, focuses its error, and reviews after correction", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(
      <DispatchCreateDialog
        canCreate
        options={{ ...options, availabilityVisible: true }}
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
    await user.click(await screen.findByRole("option", { name: /Flour/ }));
    const quantity = screen.getByLabelText("Quantity (kg)");
    await user.type(quantity, "12.51");
    await user.click(screen.getByRole("button", { name: "Review & send" }));
    expect(
      screen.queryByRole("button", { name: "Confirm dispatch" }),
    ).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain(
      "12.50 kg available",
    );
    expect(quantity.getAttribute("aria-invalid")).toBe("true");
    expect(quantity.getAttribute("aria-describedby")).toBe(
      screen.getByRole("alert").id,
    );
    expect(document.activeElement).toBe(quantity);
    expect(action).not.toHaveBeenCalled();
    await user.clear(quantity);
    await user.type(quantity, "12.50");
    expect(screen.queryByRole("alert")).toBeNull();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("button", { name: "Confirm dispatch" }),
    ).toBeTruthy();
    expect(action).not.toHaveBeenCalled();
  });

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
    expect(
      await screen.findByText("Enter who is delivering this dispatch."),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Estimated arrival date/ }),
    ).toBeTruthy();
    expect(
      screen
        .getByLabelText("Estimated arrival time (PHT)")
        .getAttribute("type"),
    ).toBe("time");
    expect(screen.queryByLabelText(/Receive by/)).toBeNull();
    const deliveryInput = screen.getByLabelText("Delivered by");
    const deliveryError = screen.getByRole("alert");
    expect(deliveryInput.getAttribute("aria-invalid")).toBe("true");
    expect(deliveryInput.getAttribute("aria-describedby")).toBe(
      deliveryError.id,
    );
    expect(
      deliveryInput.closest('[data-slot="field"]')?.contains(deliveryError),
    ).toBe(true);
    expect(document.activeElement).toBe(deliveryInput);
    await user.type(deliveryInput, "   ");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("alert")).toBe(deliveryError);
    expect(action).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Delivered by"), "Juan Dela Cruz");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(deliveryInput.getAttribute("aria-invalid")).toBe("false");
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
        delivered_by_name: "Juan Dela Cruz",
        receive_by: expect.any(String),
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
    await user.type(screen.getByLabelText("Delivered by"), "Juan");
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
        delivered_by_name: "Juan",
        receive_by: expect.any(String),
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
    await user.type(screen.getByLabelText("Delivered by"), "Juan");
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
