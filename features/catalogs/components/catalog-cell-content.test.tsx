// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { CatalogCellContent } from "./catalog-cell-content";

it("keeps the currency and exact price visible in compact product rows", () => {
  const columns = [
    { key: "product_name", label: "Product" },
    { key: "price", label: "Selling price", format: "currency" as const },
    { key: "description", label: "Description" },
  ];
  render(
    <CatalogCellContent
      record={{
        id: "meal",
        is_active: true,
        product_name: "Meal",
        price: "1255.00100",
        description: "Rice and chicken",
      }}
      column={columns[0]}
      columns={columns}
      index={0}
      responsive
    />,
  );
  expect(screen.getByText("Selling price: ₱1,255.001")).toBeDefined();
  expect(screen.getByText("Description: Rice and chicken")).toBeDefined();
});
