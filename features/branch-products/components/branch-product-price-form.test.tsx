// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  BranchProductMutationResult,
  BranchProductOperationAction,
} from "@/features/branch-products/types/branch-product.types";
import { BranchProductPriceForm } from "./branch-product-price-form";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";

afterEach(() => refresh.mockReset());

describe("branch product price form", () => {
  it("sends an updated price without converting its decimal string", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<BranchProductOperationAction>()
      .mockResolvedValue({ ok: true });
    render(
      <BranchProductPriceForm
        branchId={branchId}
        productId={productId}
        productName="Chicken sandwich"
        currentPrice="125.00"
        productIsActive
        canUpdate
        action={action}
      />,
    );

    const input = screen.getByLabelText("Price for Chicken sandwich");
    await user.clear(input);
    await user.type(input, "99.0050");
    await user.click(screen.getByRole("button", { name: "Save price" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(branchId, productId, {
        price: "99.0050",
      }),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("rejects invalid price text locally and reports server errors", async () => {
    const user = userEvent.setup();
    const action = vi.fn<BranchProductOperationAction>().mockResolvedValue({
      ok: false,
      error: "The product is inactive or this offer cannot be changed.",
    });
    render(
      <BranchProductPriceForm
        branchId={branchId}
        productId={productId}
        productName="Chicken sandwich"
        currentPrice="125.00"
        productIsActive
        canUpdate
        action={action}
      />,
    );

    const input = screen.getByLabelText("Price for Chicken sandwich");
    await user.clear(input);
    await user.type(input, "1e2");
    await user.click(screen.getByRole("button", { name: "Save price" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /enter a nonnegative decimal price/i,
    );
    expect(action).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, "100.00");
    await user.click(screen.getByRole("button", { name: "Save price" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "The product is inactive or this offer cannot be changed.",
    );
    expect((input as HTMLInputElement).disabled).toBe(false);
  });

  it("keeps price read-only without the update permission or for inactive products", () => {
    const action = vi.fn<BranchProductOperationAction>().mockResolvedValue({
      ok: true,
    } satisfies BranchProductMutationResult);
    const { rerender } = render(
      <BranchProductPriceForm
        branchId={branchId}
        productId={productId}
        productName="Chicken sandwich"
        currentPrice="125.00"
        productIsActive
        canUpdate={false}
        action={action}
      />,
    );
    expect(screen.getByText("125.00")).toBeTruthy();
    expect(
      screen.queryByRole("textbox", { name: "Price for Chicken sandwich" }),
    ).toBeNull();

    rerender(
      <BranchProductPriceForm
        branchId={branchId}
        productId={productId}
        productName="Chicken sandwich"
        currentPrice="125.00"
        productIsActive={false}
        canUpdate
        action={action}
      />,
    );
    expect(
      screen.queryByRole("textbox", { name: "Price for Chicken sandwich" }),
    ).toBeNull();
  });
});
