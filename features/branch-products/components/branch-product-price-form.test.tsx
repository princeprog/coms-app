// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BranchProductOperationAction } from "@/features/branch-products/types/branch-product.types";
import { BranchProductPriceForm } from "./branch-product-price-form";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";

afterEach(() => refresh.mockReset());

function renderPrice(action: BranchProductOperationAction, props = {}) {
  return render(
    <BranchProductPriceForm
      branchId={branchId}
      productId={productId}
      productName="Chicken sandwich"
      currentPrice="125.00"
      productIsActive
      canUpdate
      action={action}
      {...props}
    />,
  );
}

async function openPrice(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Change price" }));
}

describe("branch product price form", () => {
  it("sends an updated price without converting its decimal string", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<BranchProductOperationAction>()
      .mockResolvedValue({ ok: true });
    renderPrice(action);

    await openPrice(user);
    const input = screen.getByLabelText("Price *");
    await user.clear(input);
    await user.type(input, "99.0050");
    await user.click(screen.getByRole("button", { name: "Save price" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(branchId, productId, {
        price: "99.0050",
      }),
    );
    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toBe("Price saved.");
  });

  it("validates locally, then retains a server-rejected value for retry", async () => {
    const user = userEvent.setup();
    const action = vi.fn<BranchProductOperationAction>().mockResolvedValue({
      ok: false,
      error: "The product is inactive or this offer cannot be changed.",
    });
    renderPrice(action);

    await openPrice(user);
    const input = screen.getByLabelText("Price *");
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
    expect(input).toHaveProperty("value", "100.00");
    expect((input as HTMLInputElement).disabled).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("hides the price action without permission or for inactive products", () => {
    const action = vi.fn<BranchProductOperationAction>().mockResolvedValue({
      ok: true,
    });
    const { rerender } = renderPrice(action, { canUpdate: false });
    expect(screen.queryByRole("button", { name: "Change price" })).toBeNull();

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
    expect(screen.queryByRole("button", { name: "Change price" })).toBeNull();
    expect(action).not.toHaveBeenCalled();
  });

  it("confirms discard and leaves a dirty price open when the user keeps editing", async () => {
    const user = userEvent.setup();
    renderPrice(
      vi.fn<BranchProductOperationAction>().mockResolvedValue({ ok: true }),
    );

    await openPrice(user);
    const input = screen.getByLabelText("Price *");
    await user.clear(input);
    await user.type(input, "99.00");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      await screen.findByRole("alertdialog", {
        name: "Discard unsaved price changes?",
      }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText("Price *")).toHaveProperty("value", "99.00");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.queryByRole("dialog", { name: "Change price" })).toBeNull();
  });
});
