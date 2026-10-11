// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BranchProductFilters } from "./branch-product-filters";
const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () =>
    new URLSearchParams(
      "branch_id=3fa85f64-5717-4562-b3fc-2c963f66afa6&page=2&is_available=false",
    ),
}));
const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
describe("branch menu filters", () => {
  it("hides a single authorized branch selector and debounces search while retaining branch and availability", async () => {
    const user = userEvent.setup();
    render(
      <BranchProductFilters
        branchOptions={[{ id: branchId, name: "Downtown", status: "active" }]}
        selectedBranchId={branchId}
        filters={{ page: 2, search: "", isAvailable: false }}
      />,
    );
    expect(screen.queryByRole("combobox", { name: "Branch" })).toBeNull();
    expect(screen.getByPlaceholderText("Search by product name…")).toBeTruthy();
    await user.type(screen.getByLabelText("Search products"), "chicken");
    expect(replace).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        `/branch-products?search=chicken&branch_id=${branchId}&is_available=false&sort=product_name%3Aasc`,
        { scroll: false },
      ),
    );
  });

  it("keeps a typed search and applied filters when switching authorized branches", async () => {
    const user = userEvent.setup();
    const nextBranchId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
    render(
      <BranchProductFilters
        branchOptions={[
          {
            id: branchId,
            name: "Downtown",
            status: "active",
            serviceTypes: ["DINE_IN", "TAKEAWAY"],
          },
          {
            id: nextBranchId,
            name: "Market Branch",
            status: "active",
            serviceTypes: ["TAKEAWAY"],
          },
        ]}
        selectedBranchId={branchId}
        filters={{
          page: 2,
          search: "",
          isAvailable: false,
          serviceType: "TAKEAWAY",
          sort: "price:desc",
        }}
      />,
    );
    expect(screen.getByText("Supports Dine-in and Takeout")).toBeTruthy();
    await user.type(screen.getByLabelText("Search products"), "meal");
    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(
      await screen.findByRole("option", { name: "Market Branch" }),
    );
    const href = replace.mock.calls.at(-1)?.[0];
    expect(
      Object.fromEntries(new URL(href, "http://localhost").searchParams),
    ).toEqual({
      search: "meal",
      branch_id: nextBranchId,
      is_available: "false",
      service_type: "TAKEAWAY",
      sort: "price:desc",
    });
    expect(screen.getByLabelText("Search products").getAttribute("value")).toBe(
      "meal",
    );
  });

  it("shows fixed branch capabilities without inventing unknown service settings", () => {
    const { rerender } = render(
      <BranchProductFilters
        branchOptions={[
          {
            id: branchId,
            name: "Market Branch",
            status: "active",
            serviceTypes: ["TAKEAWAY"],
          },
        ]}
        selectedBranchId={branchId}
        filters={{ page: 1, search: "" }}
      />,
    );
    expect(screen.getByText("Supports Takeout only")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "Branch" })).toBeNull();
    rerender(
      <BranchProductFilters
        branchOptions={[
          { id: branchId, name: "Assigned branch", status: "unknown" },
        ]}
        selectedBranchId={branchId}
        filters={{ page: 1, search: "" }}
      />,
    );
    expect(screen.queryByText(/Supports/)).toBeNull();
  });

  it("clears the search field with its chip and keeps branch and sort when clearing filters", async () => {
    const user = userEvent.setup();
    render(
      <BranchProductFilters
        branchOptions={[{ id: branchId, name: "Downtown", status: "active" }]}
        selectedBranchId={branchId}
        filters={{
          page: 2,
          search: "chicken",
          isAvailable: false,
          sort: "price:desc",
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Search: chicken" }));
    expect(
      (screen.getByLabelText("Search products") as HTMLInputElement).value,
    ).toBe("");
    await user.type(screen.getByLabelText("Search products"), "draft");
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(
      (screen.getByLabelText("Search products") as HTMLInputElement).value,
    ).toBe("");
    expect(
      Object.fromEntries(
        new URL(replace.mock.calls.at(-1)?.[0], "http://localhost")
          .searchParams,
      ),
    ).toEqual({
      branch_id: branchId,
      sort: "price:desc",
    });
  });
});
