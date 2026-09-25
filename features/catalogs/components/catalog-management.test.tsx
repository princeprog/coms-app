// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogManagement } from "./catalog-management";
import type { CatalogDisplayColumn } from "@/features/catalogs/types/catalog.types";

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
const displayColumns: CatalogDisplayColumn[] = [
  { key: "supplier_name", label: "Supplier" },
  { key: "contact_person", label: "Contact person" },
  { key: "contact_number", label: "Phone" },
  { key: "email", label: "Email" },
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
      displayColumns={displayColumns}
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

async function openRowActions(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("button", {
    name: "More actions for North Farm Supply",
  });
  trigger.focus();
  await user.keyboard("{Enter}");
  return screen.getByRole("menu");
}

describe("catalog management", () => {
  beforeEach(() => {
    refresh.mockClear();
  });

  it("renders explicit catalog columns and keeps long-form address in record details", async () => {
    const user = userEvent.setup();
    renderCatalog();

    const table = screen.getByRole("table", { name: "Suppliers" });
    expect(
      within(table).getByRole("columnheader", { name: "Supplier" }),
    ).toBeTruthy();
    expect(
      within(table).getByRole("columnheader", { name: "Contact person" }),
    ).toBeTruthy();
    expect(
      within(table).getByRole("columnheader", { name: "Phone" }),
    ).toBeTruthy();
    expect(
      within(table).getByRole("columnheader", { name: "Email" }),
    ).toBeTruthy();
    expect(within(table).queryByText("Address")).toBeNull();

    await openRowActions(user);
    await user.click(screen.getByRole("menuitem", { name: "View details" }));
    expect(
      screen.getByRole("dialog", { name: "Supplier details" }),
    ).toBeTruthy();
    expect(screen.getByText("Address")).toBeTruthy();
    expect(within(screen.getByRole("dialog")).getAllByText("—")).toHaveLength(
      1,
    );
  });

  it("puts catalog row actions behind an accessible menu", async () => {
    const user = userEvent.setup();
    renderCatalog();

    expect(
      screen.queryByRole("button", {
        name: "View North Farm Supply details",
      }),
    ).toBeNull();

    await user.click(
      screen.getByRole("button", {
        name: "More actions for North Farm Supply",
      }),
    );
    const menu = await screen.findByRole("menu");
    expect(
      within(menu).getByRole("menuitem", { name: "View details" }),
    ).toBeTruthy();
    expect(within(menu).getByRole("menuitem", { name: "Edit" })).toBeTruthy();
    expect(
      within(menu).getByRole("menuitem", { name: "Deactivate" }),
    ).toBeTruthy();
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

  it("confirms discarding a dirty form and preserves the draft when asked to keep editing", async () => {
    const user = userEvent.setup();
    renderCatalog({ page: { items: [], total: 0, page: 1, page_size: 25 } });

    await user.click(screen.getByRole("button", { name: "Add supplier" }));
    await user.type(
      screen.getByLabelText("Supplier name"),
      "North Farm Supply",
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    const confirmation = screen.getByRole("alertdialog", {
      name: "Discard unsaved supplier changes?",
    });
    await user.click(
      within(confirmation).getByRole("button", { name: "Keep editing" }),
    );
    expect(screen.getByLabelText("Supplier name")).toHaveProperty(
      "value",
      "North Farm Supply",
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    const secondConfirmation = screen.getByRole("alertdialog", {
      name: "Discard unsaved supplier changes?",
    });
    await user.click(
      within(secondConfirmation).getByRole("button", {
        name: "Discard changes",
      }),
    );
    expect(
      screen.queryByRole("dialog", { name: "Create supplier" }),
    ).toBeNull();
  });

  it("retains catalog form values after server rejection so the user can retry", async () => {
    const user = userEvent.setup();
    createAction.mockClear();
    createAction
      .mockResolvedValueOnce({
        ok: false as const,
        error: "Supplier name already exists.",
      })
      .mockResolvedValueOnce({ ok: true as const });
    renderCatalog({ page: { items: [], total: 0, page: 1, page_size: 25 } });

    await user.click(screen.getByRole("button", { name: "Add supplier" }));
    await user.type(
      screen.getByLabelText("Supplier name"),
      "North Farm Supply",
    );
    await user.click(screen.getByRole("button", { name: "Create supplier" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Supplier name already exists.",
    );
    expect(screen.getByLabelText("Supplier name")).toHaveProperty(
      "value",
      "North Farm Supply",
    );

    await user.click(screen.getByRole("button", { name: "Create supplier" }));
    await waitFor(() => expect(createAction).toHaveBeenCalledTimes(2));
  });

  it("updates the selected record without changing other values", async () => {
    const user = userEvent.setup();
    updateAction.mockClear();
    renderCatalog();

    await openRowActions(user);
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
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

    await openRowActions(user);
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(screen.getByRole("dialog", { name: "Edit supplier" })).toBeTruthy();
  });

  it("hides create, edit, and deactivate actions without their grants", async () => {
    const user = userEvent.setup();
    renderCatalog({ canCreate: false, canUpdate: false, canDeactivate: false });

    expect(screen.queryByRole("button", { name: "Add supplier" })).toBeNull();
    const menu = await openRowActions(user);
    expect(within(menu).queryByRole("menuitem", { name: "Edit" })).toBeNull();
    expect(
      within(menu).queryByRole("menuitem", { name: "Deactivate" }),
    ).toBeNull();
    expect(
      within(menu).getByRole("menuitem", { name: "View details" }),
    ).toBeTruthy();
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
    expect(screen.getByLabelText("Status").textContent).toMatch(/^Active/);
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe("/suppliers?page=2&search=North+Farm&is_active=true");
  });

  it("opens the deactivate confirmation with Enter and deactivates only after confirmation", async () => {
    const user = userEvent.setup();
    deactivateAction.mockClear();
    renderCatalog();

    const trigger = screen.getByRole("button", {
      name: "More actions for North Farm Supply",
    });
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("menuitem", { name: "Deactivate" }));

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
