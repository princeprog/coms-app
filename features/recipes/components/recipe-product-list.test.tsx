// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProductPage } from "@/features/products/types/product.types";
import { RecipeProductList } from "./recipe-product-list";

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

function productPage(overrides: Partial<ProductPage> = {}): ProductPage {
  return {
    items: [
      {
        id,
        product_name: "Chicken sandwich",
        description: "Grilled chicken",
        is_active: true,
        created_at: "2026-09-24T01:30:00.000Z",
        updated_at: "2026-09-24T01:30:00.000Z",
      },
    ],
    total: 1,
    page: 1,
    page_size: 25,
    ...overrides,
  };
}

describe("recipe product list", () => {
  it("links active products to their recipe and preserves search in pagination", () => {
    render(
      <RecipeProductList
        page={productPage({ total: 30, page_size: 25 })}
        search="sandwich"
      />,
    );

    expect(screen.getByRole("search")).toBeTruthy();
    expect(screen.getByLabelText("Search products")).toHaveProperty(
      "value",
      "sandwich",
    );
    expect(
      screen.getByRole("link", { name: "Manage recipe" }).getAttribute("href"),
    ).toBe(`/recipes/${id}`);
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe("/recipes?search=sandwich&page=2");
  });

  it("offers a path to products when there are no active products", () => {
    render(
      <RecipeProductList
        page={productPage({ items: [], total: 0 })}
        search=""
      />,
    );
    expect(
      screen.getByRole("link", { name: "Open products" }).getAttribute("href"),
    ).toBe("/products");
  });
});
