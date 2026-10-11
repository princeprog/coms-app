// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { CatalogManagement } from "@/features/catalogs/components/catalog-management";
import { paymentMethodDisplayColumns, paymentMethodFields } from "./fields";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

it("uses payment-method directory copy and colored icons for every row action", async () => {
  const user = userEvent.setup();
  render(
    <CatalogManagement
      directoryLayout
      directoryTitle="Accepted payment methods"
      directoryDescription="Methods available at checkout, listed A–Z."
      title="Payment methods"
      resourceName="payment method"
      description="Manage checkout methods."
      routePath="/payment-methods"
      fields={paymentMethodFields}
      displayColumns={paymentMethodDisplayColumns}
      page={{
        items: [
          {
            id: "cash",
            name: "Cash",
            kind: "CASH",
            status: "enabled",
            is_active: true,
          },
        ],
        total: 1,
        page: 1,
        page_size: 25,
      }}
      search=""
      activeFilter="all"
      canCreate
      canUpdate
      canDeactivate
      createAction={vi.fn()}
      updateAction={vi.fn()}
      deactivateAction={vi.fn()}
    />,
  );

  expect(
    screen.getByRole("heading", { name: "Accepted payment methods" }),
  ).toBeTruthy();
  expect(screen.queryByText("Stock item directory")).toBeNull();
  await user.click(
    screen.getByRole("button", { name: "More actions for Cash" }),
  );
  const menu = await screen.findByRole("menu");
  const view = within(menu).getByRole("menuitem", { name: "View details" });
  const edit = within(menu).getByRole("menuitem", { name: "Edit" });
  const deactivate = within(menu).getByRole("menuitem", {
    name: "Deactivate",
  });
  expect(view.querySelector("svg")?.getAttribute("class")).toContain("blue");
  expect(edit.querySelector("svg")?.getAttribute("class")).toContain("amber");
  expect(deactivate.querySelector("svg")?.getAttribute("class")).toContain(
    "destructive",
  );
});
