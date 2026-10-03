// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { DispatchCreateLineFields } from "./dispatch-create-line-fields";

const stock = {
  id: "stock-id",
  stock_item_name: "Flour",
  unit: "kg",
  quantity_on_hand: "71.25",
};
vi.mock("../services/dispatch-stock-actions", () => ({
  searchDispatchStock: async () => ({
    items: [stock],
    total: 1,
    page: 1,
    page_size: 25,
    availabilityVisible: true,
  }),
}));

describe("dispatch stock visibility", () => {
  it("hides retained selected balances when inventory access is removed", () => {
    const client = new QueryClient();
    const view = (availabilityVisible: boolean) => (
      <QueryClientProvider client={client}>
        <DispatchCreateLineFields
          availabilityVisible={availabilityVisible}
          lines={[
            {
              key: 1,
              stock_item_id: stock.id,
              quantity_dispatched: "2",
              stock,
            },
          ]}
          disabled={false}
          onChange={vi.fn()}
          onRemove={vi.fn()}
          onStockSelect={vi.fn()}
        />
      </QueryClientProvider>
    );
    const rendered = render(view(true));
    expect(screen.getByText(/Available: 71.25/)).toBeTruthy();
    rendered.rerender(view(false));
    expect(screen.queryByText(/Available: 71.25/)).toBeNull();
    expect(screen.getByLabelText("Quantity (kg)")).toHaveProperty("value", "2");
  });

  it("does not show cached balances in stock options without current inventory visibility", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <DispatchCreateLineFields
          availabilityVisible={false}
          lines={[{ key: 1, stock_item_id: "", quantity_dispatched: "" }]}
          disabled={false}
          onChange={vi.fn()}
          onRemove={vi.fn()}
          onStockSelect={vi.fn()}
        />
      </QueryClientProvider>,
    );
    await userEvent
      .setup()
      .click(screen.getByRole("combobox", { name: "Stock item 1" }));
    await screen.findByRole("option", { name: /Flour/ });
    expect(screen.queryByText(/Available: 71.25/)).toBeNull();
  });
});
