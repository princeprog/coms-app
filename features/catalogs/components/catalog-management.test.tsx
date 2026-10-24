// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogManagement } from "./catalog-management";
import { toast } from "@/components/ui/toast";
import type { CatalogDisplayColumn } from "@/features/catalogs/types/catalog.types";
import {
  stockItemDisplayColumns,
  stockItemFields,
} from "@/features/stock-items/constants";

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
  afterEach(() => vi.mocked(toast.add).mockRestore());
  beforeEach(() => {
    refresh.mockClear();
    vi.spyOn(toast, "add").mockReturnValue("catalog-success");
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
    expect(toast.add).toHaveBeenCalledWith({
      type: "success",
      title: "Supplier created.",
    });
  });

  it("creates a stock item from the grouped name, category, and unit fields", async () => {
    const user = userEvent.setup();
    const createStockItem = vi.fn().mockResolvedValue({ ok: true as const });
    renderCatalog({
      title: "Stock Items",
      resourceName: "stock item",
      description: "Maintain stock items.",
      routePath: "/stock-items",
      displayColumns: stockItemDisplayColumns,
      fields: stockItemFields,
      page: { items: [], total: 0, page: 1, page_size: 25 },
      createAction: createStockItem,
    });

    await user.click(screen.getByRole("button", { name: "Add stock item" }));
    const dialog = screen.getByRole("dialog", { name: "Create stock item" });
    expect(within(dialog).queryByText("Item identity")).toBeNull();
    expect(
      within(dialog).queryByText("Classification and tracking"),
    ).toBeNull();
    expect(
      within(dialog).queryByText(
        "Give the item a familiar name that is easy to find during daily work.",
      ),
    ).toBeNull();
    const itemName = within(dialog).getByRole("textbox", {
      name: "Stock item name",
    });
    expect(itemName).toHaveProperty("required", true);
    expect(itemName.getAttribute("aria-describedby")).toBeNull();
    const category = within(dialog).getByRole("combobox", {
      name: "Category",
    });
    expect(category.textContent).toContain("Select a category");
    expect(
      within(dialog).queryByRole("textbox", { name: "Category" }),
    ).toBeNull();
    const unit = within(dialog).getByRole("textbox", { name: "Unit" });
    const dailyCount = within(dialog).getByRole("checkbox", {
      name: "Include in daily branch counts",
    });
    expect(dailyCount.getAttribute("aria-checked")).toBe("true");
    await user.click(dailyCount);
    expect(unit).toHaveProperty("required", true);
    expect(unit.getAttribute("aria-describedby")).toBeNull();

    await user.type(
      within(dialog).getByLabelText("Stock item name"),
      "  All-purpose flour  ",
    );
    await user.type(within(dialog).getByLabelText("Unit"), "kg");
    await user.click(
      within(dialog).getByRole("button", { name: "Create stock item" }),
    );
    expect(createStockItem).not.toHaveBeenCalled();
    await user.click(category);
    await user.click(
      await screen.findByRole("option", { name: "Rice and grains" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Create stock item" }),
    );

    await waitFor(() =>
      expect(createStockItem).toHaveBeenCalledWith({
        stock_item_name: "All-purpose flour",
        category: "Rice and grains",
        unit: "kg",
        recipe_use: "RECIPE",
        daily_count_required: false,
      }),
    );
    expect(toast.add).toHaveBeenCalledTimes(1);
    expect(toast.add).toHaveBeenCalledWith({
      type: "success",
      title: "Stock item created.",
    });
  });

  it("shows accessible progress while stock item creation is pending", async () => {
    const user = userEvent.setup();
    let completeCreate: (result: { ok: true }) => void = () => undefined;
    const createStockItem = vi.fn(
      () =>
        new Promise<{ ok: true }>((resolve) => {
          completeCreate = resolve;
        }),
    );
    renderCatalog({
      title: "Stock Items",
      resourceName: "stock item",
      description: "Maintain stock items.",
      routePath: "/stock-items",
      displayColumns: stockItemDisplayColumns,
      fields: stockItemFields,
      page: { items: [], total: 0, page: 1, page_size: 25 },
      createAction: createStockItem,
    });

    await user.click(screen.getByRole("button", { name: "Add stock item" }));
    const dialog = screen.getByRole("dialog", { name: "Create stock item" });
    await user.type(
      within(dialog).getByLabelText("Stock item name"),
      "All-purpose flour",
    );
    await user.type(within(dialog).getByLabelText("Unit"), "kg");
    await user.click(
      within(dialog).getByRole("combobox", { name: "Category" }),
    );
    await user.click(
      await screen.findByRole("option", { name: "Rice and grains" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Create stock item" }),
    );

    const pendingButton = within(dialog).getByRole("button", {
      name: "Creating stock item…",
    });
    expect(pendingButton).toHaveProperty("disabled", true);
    expect(
      within(pendingButton).getByRole("status", { name: "Loading" }),
    ).toBeTruthy();
    expect(
      within(dialog).getByRole("button", { name: "Cancel" }),
    ).toHaveProperty("disabled", true);

    completeCreate({ ok: true });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Create stock item" }),
      ).toBeNull(),
    );
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
    expect(toast.add).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Supplier name")).toHaveProperty(
      "value",
      "North Farm Supply",
    );

    await user.click(screen.getByRole("button", { name: "Create supplier" }));
    await waitFor(() => expect(createAction).toHaveBeenCalledTimes(2));
  });

  it("edits stock items with the create controls while preserving saved categories and count settings", async () => {
    const user = userEvent.setup();
    const update = vi.fn().mockResolvedValue({ ok: false, error: "Try again" });
    renderCatalog({
      resourceName: "stock item",
      title: "Stock items",
      routePath: "/stock-items",
      fields: stockItemFields,
      displayColumns: stockItemDisplayColumns,
      updateAction: update,
      page: {
        items: [
          {
            id: supplier.id,
            stock_item_name: "Soy sauce",
            category: "Legacy condiments",
            unit: "L",
            is_active: true,
            recipe_use: "RECIPE",
            daily_count_required: false,
          },
        ],
        total: 1,
        page: 1,
        page_size: 10,
      },
    });
    expect(
      screen.queryByRole("columnheader", { name: "Recipe use" }),
    ).toBeNull();
    expect(
      screen.queryByRole("columnheader", { name: "Branch count" }),
    ).toBeNull();
    const trigger = screen.getByRole("button", {
      name: "More actions for Soy sauce",
    });
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    const dialog = screen.getByRole("dialog", { name: "Edit stock item" });
    const category = within(dialog).getByRole("combobox", { name: "Category" });
    expect(category.textContent).toContain("Legacy condiments");
    expect(
      within(dialog).queryByRole("textbox", { name: "Category" }),
    ).toBeNull();
    expect(
      within(dialog).getByRole("textbox", { name: "Stock item name" }),
    ).toHaveProperty("value", "Soy sauce");
    expect(
      within(dialog).getByRole("textbox", { name: "Unit" }),
    ).toHaveProperty("value", "L");
    const checkbox = screen.getByRole("checkbox", {
      name: "Include in daily branch counts",
    });
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
    await user.click(screen.getByRole("button", { name: "Save stock item" }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        supplier.id,
        expect.objectContaining({
          category: "Legacy condiments",
          daily_count_required: false,
        }),
      ),
    );
    await user.click(category);
    await user.click(
      await screen.findByRole("option", { name: "Sauces and seasonings" }),
    );
    await waitFor(() =>
      expect(category.textContent).toContain("Sauces and seasonings"),
    );
    await user.click(checkbox);
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    await user.click(screen.getByRole("button", { name: "Save stock item" }));
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        supplier.id,
        expect.objectContaining({
          category: "Sauces and seasonings",
          daily_count_required: true,
        }),
      ),
    );
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
