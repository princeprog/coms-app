// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BranchProductFilters } from "./branch-product-filters";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const otherBranchId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";

describe("branch product filters", () => {
  it("keeps branch, search, and availability selections in an accessible GET form", () => {
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
    expect(form.getAttribute("method")).toBe("get");
    expect((screen.getByLabelText("Branch") as HTMLSelectElement).value).toBe(
      branchId,
    );
    expect(
      (screen.getByLabelText("Search products") as HTMLInputElement).value,
    ).toBe("chicken");
    expect(
      (screen.getByLabelText("Availability") as HTMLSelectElement).value,
    ).toBe("false");
    expect(
      screen.getByRole("option", { name: "Airport (inactive)" }),
    ).toBeTruthy();
  });
});
