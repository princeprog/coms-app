// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  RecipeResponse,
  RecipeSaveAction,
  RecipeStockItem,
} from "@/features/recipes/types/recipe.types";
import { RecipeEditor } from "./recipe-editor";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const flourId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const oilId = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const timestamp = "2026-09-24T01:30:00.000Z";

const emptyRecipe: RecipeResponse = {
  product: {
    id: productId,
    product_name: "Chicken sandwich",
    description: null,
    is_active: true,
  },
  items: [],
};

const stockItems: RecipeStockItem[] = [
  {
    id: flourId,
    stock_item_name: "Flour",
    category: "Baking",
    unit: "kg",
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  },
  {
    id: oilId,
    stock_item_name: "Oil",
    category: "Cooking",
    unit: "L",
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  },
];

afterEach(() => refresh.mockReset());

describe("recipe editor", () => {
  it("creates a recipe with exact decimal quantities and refreshes on success", async () => {
    const user = userEvent.setup();
    const action = vi.fn<RecipeSaveAction>().mockResolvedValue({ ok: true });
    render(
      <RecipeEditor
        recipe={emptyRecipe}
        stockItems={stockItems}
        canReadStockItems
        stockItemsLoaded
        canCreate
        canUpdate={false}
        action={action}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText("Ingredient 1 stock item"),
      flourId,
    );
    await user.type(
      screen.getByLabelText("Ingredient 1 quantity required"),
      "0.0250",
    );
    await user.click(screen.getByRole("button", { name: "Save recipe" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(productId, "create", {
        items: [{ stock_item_id: flourId, quantity_required: "0.0250" }],
      }),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("blocks empty and duplicate ingredient rows before calling the action", async () => {
    const user = userEvent.setup();
    const action = vi.fn<RecipeSaveAction>().mockResolvedValue({ ok: true });
    render(
      <RecipeEditor
        recipe={emptyRecipe}
        stockItems={stockItems}
        canReadStockItems
        stockItemsLoaded
        canCreate
        canUpdate={false}
        action={action}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save recipe" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /add at least one ingredient/i,
    );

    await user.selectOptions(
      screen.getByLabelText("Ingredient 1 stock item"),
      flourId,
    );
    await user.type(
      screen.getByLabelText("Ingredient 1 quantity required"),
      "1",
    );
    await user.click(screen.getByRole("button", { name: "Add ingredient" }));
    await user.selectOptions(
      screen.getByLabelText("Ingredient 2 stock item"),
      flourId,
    );
    await user.type(
      screen.getByLabelText("Ingredient 2 quantity required"),
      "2",
    );
    await user.click(screen.getByRole("button", { name: "Save recipe" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /choose each stock item only once/i,
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("replaces recipes and requires inactive ingredients to be removed or replaced", async () => {
    const inactiveRecipe: RecipeResponse = {
      ...emptyRecipe,
      items: [
        {
          product_id: productId,
          stock_item_id: flourId,
          stock_item_name: "Retired flour",
          unit: "kg",
          stock_item_is_active: false,
          quantity_required: "1.00",
          created_at: timestamp,
          updated_at: timestamp,
        },
      ],
    };
    const user = userEvent.setup();
    const action = vi.fn<RecipeSaveAction>().mockResolvedValue({ ok: true });
    render(
      <RecipeEditor
        recipe={inactiveRecipe}
        stockItems={stockItems.filter((item) => item.id !== flourId)}
        canReadStockItems
        stockItemsLoaded
        canCreate={false}
        canUpdate
        action={action}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save recipe" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /replace or remove inactive stock items/i,
    );
    await user.selectOptions(
      screen.getByLabelText("Ingredient 1 stock item"),
      oilId,
    );
    await user.click(screen.getByRole("button", { name: "Save recipe" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(productId, "update", {
        items: [{ stock_item_id: oilId, quantity_required: "1.00" }],
      }),
    );
  });

  it("keeps saved recipe details readable without stock-item edit access", () => {
    const savedRecipe: RecipeResponse = {
      ...emptyRecipe,
      items: [
        {
          product_id: productId,
          stock_item_id: flourId,
          stock_item_name: "Flour",
          unit: "kg",
          stock_item_is_active: true,
          quantity_required: "0.0250",
          created_at: timestamp,
          updated_at: timestamp,
        },
      ],
    };
    render(
      <RecipeEditor
        recipe={savedRecipe}
        stockItems={[]}
        canReadStockItems={false}
        stockItemsLoaded={false}
        canCreate
        canUpdate
        action={vi.fn<RecipeSaveAction>()}
      />,
    );

    expect(
      screen.getByRole("table", { name: "Saved recipe ingredients" }),
    ).toBeTruthy();
    expect(screen.getByText("0.0250")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save recipe" })).toBeNull();
    expect(
      screen.getByText(/stock item read access is required/i),
    ).toBeTruthy();
  });
});
