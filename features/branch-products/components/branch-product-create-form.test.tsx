// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BranchProductMutationResult } from "@/features/branch-products/types/branch-product.types";
import { BranchProductCreateForm } from "./branch-product-create-form";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const products = [{ id: productId, product_name: "Chicken sandwich" }];

afterEach(() => refresh.mockReset());

describe("branch product create form", () => {
  it("creates an offer with the selected product and exact price string", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<
        (
          branchId: string,
          input: unknown,
        ) => Promise<BranchProductMutationResult>
      >()
      .mockResolvedValue({ ok: true });
    render(
      <BranchProductCreateForm
        branchId={branchId}
        branchName="Downtown"
        products={products}
        action={action}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText("Product to offer"),
      productId,
    );
    await user.type(screen.getByLabelText("Offer price"), "000.1250");
    await user.click(screen.getByRole("button", { name: "Add product offer" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(branchId, {
        product_id: productId,
        price: "000.1250",
      }),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("rejects missing selections and malformed prices before calling the action", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(
      <BranchProductCreateForm
        branchId={branchId}
        branchName="Downtown"
        products={products}
        action={action}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add product offer" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /select a product and enter a nonnegative decimal price/i,
    );
    await user.selectOptions(
      screen.getByLabelText("Product to offer"),
      productId,
    );
    await user.type(screen.getByLabelText("Offer price"), "1e2");
    await user.click(screen.getByRole("button", { name: "Add product offer" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /select a product and enter a nonnegative decimal price/i,
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("keeps the form available and shows API errors for retry", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<
        (
          branchId: string,
          input: unknown,
        ) => Promise<BranchProductMutationResult>
      >()
      .mockResolvedValue({
        ok: false,
        error: "This product is already offered at the branch.",
      });
    render(
      <BranchProductCreateForm
        branchId={branchId}
        branchName="Downtown"
        products={products}
        action={action}
      />,
    );
    await user.selectOptions(
      screen.getByLabelText("Product to offer"),
      productId,
    );
    await user.type(screen.getByLabelText("Offer price"), "10.00");
    await user.click(screen.getByRole("button", { name: "Add product offer" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "This product is already offered at the branch.",
    );
    expect(
      (screen.getByLabelText("Offer price") as HTMLInputElement).disabled,
    ).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
  });
});
