// @vitest-environment jsdom
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CatalogEditorDialog } from "@/features/catalogs/components/catalog-editor-dialog";
import { paymentMethodFields } from "./fields";

describe("payment method editor", () => {
  it("presents clear payment behavior and availability choices when creating", async () => {
    const create = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <CatalogEditorDialog
        open
        record={null}
        resourceName="payment method"
        fields={paymentMethodFields}
        createAction={create}
        updateAction={vi.fn()}
        onOpenChange={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog", {
      name: "Create payment method",
    });
    expect(within(dialog).getByText("Payment behavior")).toBeTruthy();
    expect(within(dialog).getByText("Availability")).toBeTruthy();
    expect(
      within(dialog)
        .getByRole("radio", { name: /Non-cash/ })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      within(dialog)
        .getByRole("radio", { name: /Active/ })
        .getAttribute("aria-checked"),
    ).toBe("true");

    await user.type(
      within(dialog).getByLabelText("Payment method name"),
      "  GCash  ",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Create payment method" }),
    );
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        name: "GCash",
        kind: "NON_CASH",
        status: "enabled",
      }),
    );
  });

  it("keeps failed edits and allows an inactive method to be reactivated", async () => {
    const update = vi
      .fn()
      .mockResolvedValue({ ok: false, error: "Please retry" });
    const user = userEvent.setup();
    render(
      <CatalogEditorDialog
        open
        record={{
          id: "method",
          name: "Wallet",
          kind: "NON_CASH",
          status: "disabled",
          is_active: false,
        }}
        resourceName="payment method"
        fields={paymentMethodFields}
        createAction={vi.fn()}
        updateAction={update}
        onOpenChange={vi.fn()}
        onComplete={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("radio", { name: /Active/ }));
    fireEvent.change(screen.getByLabelText("Payment method name"), {
      target: { value: "GCash" },
    });
    await user.click(
      screen.getByRole("button", { name: "Save payment method" }),
    );
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith("method", {
        name: "GCash",
        kind: "NON_CASH",
        status: "enabled",
      }),
    );
    expect(screen.getByRole("alert").textContent).toContain("Please retry");
    expect(screen.getByLabelText("Payment method name")).toHaveProperty(
      "value",
      "GCash",
    );
  });
});
