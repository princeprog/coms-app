// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BranchProductFilters } from "./branch-product-filters";

vi.mock("next/form", () => ({
  default: ({ children, ...props }: React.ComponentProps<"form">) => (
    <form {...props}>{children}</form>
  ),
}));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const otherBranchId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";

describe("branch product filters", () => {
  it("keeps branch, search, and availability selections in client GET navigation", async () => {
    const user = userEvent.setup();
    render(
      <BranchProductFilters
        branchOptions={[
          { id: branchId, name: "Downtown", status: "active" },
          { id: otherBranchId, name: "Airport", status: "inactive" },
        ]}
        selectedBranchId={branchId}
        filters={{ page: 2, search: "chicken", isAvailable: false }}
      />,
    );

    const form = screen.getByRole("form", { name: "Filter branch products" });
    expect(form.getAttribute("action")).toBe("/branch-products");
    expect(form.hasAttribute("method")).toBe(false);
    expect(form.querySelector('input[name="page"]')).toBeNull();
    expect(
      form.querySelector<HTMLInputElement>('input[name="branch_id"]')?.value,
    ).toBe(branchId);
    expect(
      (screen.getByLabelText("Search products") as HTMLInputElement).value,
    ).toBe("chicken");
    expect(
      form.querySelector<HTMLInputElement>('input[name="is_available"]')?.value,
    ).toBe("false");
    expect(
      screen.getByRole("combobox", { name: "Branch" }).textContent,
    ).toContain("Downtown");
    expect(
      screen.getByRole("combobox", { name: "Availability" }).textContent,
    ).toContain("Not available");
    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(
      await screen.findByRole("option", { name: "Airport (inactive)" }),
    );
    expect(
      form.querySelector<HTMLInputElement>('input[name="branch_id"]')?.value,
    ).toBe(otherBranchId);
    expect(
      (screen.getByLabelText("Search products") as HTMLInputElement).value,
    ).toBe("chicken");
    expect(
      form.querySelector<HTMLInputElement>('input[name="is_available"]')?.value,
    ).toBe("false");
  });
});
