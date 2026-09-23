// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BranchProductOperationAction } from "@/features/branch-products/types/branch-product.types";
import { BranchProductAvailabilityForm } from "./branch-product-availability-form";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";

afterEach(() => refresh.mockReset());

describe("branch product availability form", () => {
  it("saves availability as a separate action and refreshes the listing", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<BranchProductOperationAction>()
      .mockResolvedValue({ ok: true });
    render(
      <BranchProductAvailabilityForm
        branchId={branchId}
        productId={productId}
        productName="Chicken sandwich"
        isAvailable
        productIsActive
        canUpdate
        action={action}
      />,
    );

    await user.click(
      screen.getByRole("checkbox", {
        name: "Available for sale for Chicken sandwich",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Save availability" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(branchId, productId, {
        is_available: false,
      }),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("prevents re-enabling an inactive product and keeps availability read-only without permission", () => {
    const action = vi.fn<BranchProductOperationAction>().mockResolvedValue({
      ok: true,
    });
    const { rerender } = render(
      <BranchProductAvailabilityForm
        branchId={branchId}
        productId={productId}
        productName="Chicken sandwich"
        isAvailable={false}
        productIsActive={false}
        canUpdate
        action={action}
      />,
    );
    expect(
      (
        screen.getByRole("checkbox", {
          name: "Available for sale for Chicken sandwich",
        }) as HTMLInputElement
      ).disabled,
    ).toBe(true);

    rerender(
      <BranchProductAvailabilityForm
        branchId={branchId}
        productId={productId}
        productName="Chicken sandwich"
        isAvailable
        productIsActive
        canUpdate={false}
        action={action}
      />,
    );
    expect(screen.getByText("Available")).toBeTruthy();
    expect(
      screen.queryByRole("checkbox", {
        name: "Available for sale for Chicken sandwich",
      }),
    ).toBeNull();
    expect(action).not.toHaveBeenCalled();
  });
});
