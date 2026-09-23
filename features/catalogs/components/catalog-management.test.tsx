// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogManagement } from "./catalog-management";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const fields = [
  {
    key: "supplier_name",
    label: "Supplier name",
    required: true,
    maxLength: 160,
  },
  { key: "email", label: "Email", type: "email" as const, maxLength: 254 },
  { key: "address", label: "Address", type: "textarea" as const },
];

const supplier = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  supplier_name: "North Farm Supply",
  email: "orders@northfarm.test",
  address: null,
  is_active: true,
};

const createAction = vi.fn().mockResolvedValue({ ok: true as const });
const updateAction = vi.fn().mockResolvedValue({ ok: true as const });
const deactivateAction = vi.fn().mockResolvedValue({ ok: true as const });

function renderCatalog(
  overrides: Partial<ComponentProps<typeof CatalogManagement>> = {},
) {
  return render(
    <CatalogManagement
      title="Suppliers"
      resourceName="supplier"
      description="Manage supplier contact details."
      routePath="/suppliers"
      nameField="supplier_name"
      fields={fields}
      page={{ items: [supplier], total: 1, page: 1, page_size: 25 }}
      search=""
      activeFilter="all"
      canCreate
      canUpdate
      canDeactivate
      createAction={createAction}
      updateAction={updateAction}
      deactivateAction={deactivateAction}
      {...overrides}
    />,
  );
}

describe("catalog management", () => {
  beforeEach(() => {
    refresh.mockClear();
  });

  it("creates a catalog entry after trimming text and clearing blank optional fields", async () => {
    const user = userEvent.setup();
    createAction.mockClear();
    renderCatalog({ page: { items: [], total: 0, page: 1, page_size: 25 } });

    await user.click(screen.getByRole("button", { name: "Add supplier" }));
    await user.type(
      screen.getByLabelText("Supplier name"),
      "  North Farm Supply  ",
    );
    await user.type(screen.getByLabelText("Email"), " orders@northfarm.test ");
    await user.click(screen.getByRole("button", { name: "Create supplier" }));

    await waitFor(() =>
      expect(createAction).toHaveBeenCalledWith({
        supplier_name: "North Farm Supply",
        email: "orders@northfarm.test",
        address: null,
      }),
    );
    expect(screen.getByRole("status").textContent).toBe("Supplier created.");
  });

  it("updates the selected record without changing other values", async () => {
    const user = userEvent.setup();
    updateAction.mockClear();
    renderCatalog();

    await user.click(
      screen.getByRole("button", { name: "Edit North Farm Supply" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Edit supplier" });
    await user.clear(within(dialog).getByLabelText("Supplier name"));
    await user.type(
      within(dialog).getByLabelText("Supplier name"),
      "North Farm Foods",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Save supplier" }),
    );

    await waitFor(() =>
      expect(updateAction).toHaveBeenCalledWith(supplier.id, {
        supplier_name: "North Farm Foods",
        email: "orders@northfarm.test",
        address: null,
      }),
    );
  });

  it("allows edits when update is granted without create access", async () => {
    const user = userEvent.setup();
    updateAction.mockClear();
    renderCatalog({ canCreate: false });

    await user.click(
      screen.getByRole("button", { name: "Edit North Farm Supply" }),
    );
    expect(screen.getByRole("dialog", { name: "Edit supplier" })).toBeTruthy();
  });

  it("hides create, edit, and deactivate controls without their grants", () => {
    renderCatalog({ canCreate: false, canUpdate: false, canDeactivate: false });

    expect(screen.queryByRole("button", { name: "Add supplier" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Edit North Farm Supply" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /Deactivate/ })).toBeNull();
  });

  it("keeps the current search and status filters while moving between pages", () => {
    renderCatalog({
      page: { items: [supplier], total: 51, page: 1, page_size: 25 },
      search: "North Farm",
      activeFilter: "true",
    });

    expect(
      screen.getByRole("searchbox", { name: "Search suppliers" }),
    ).toHaveProperty("value", "North Farm");
    expect(screen.getByLabelText("Status")).toHaveProperty("value", "true");
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe("/suppliers?page=2&search=North+Farm&is_active=true");
  });

  it("opens the deactivate confirmation with Enter and deactivates only after confirmation", async () => {
    const user = userEvent.setup();
    deactivateAction.mockClear();
    renderCatalog();

    const trigger = screen.getByRole("button", {
      name: "Deactivate North Farm Supply",
    });
    trigger.focus();
    await user.keyboard("{Enter}");

    const dialog = screen.getByRole("alertdialog", {
      name: "Deactivate North Farm Supply?",
    });
    expect(deactivateAction).not.toHaveBeenCalled();
    await user.click(
      within(dialog).getByRole("button", { name: "Confirm deactivation" }),
    );
    await waitFor(() =>
      expect(deactivateAction).toHaveBeenCalledWith(supplier.id),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });
});
