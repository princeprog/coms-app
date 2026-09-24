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

function renderAvailability(action: BranchProductOperationAction, props = {}) {
  return render(
    <BranchProductAvailabilityForm
      branchId={branchId}
      productId={productId}
      productName="Chicken sandwich"
      isAvailable
      productIsActive
      canUpdate
      action={action}
      {...props}
    />,
  );
}

async function openAvailability(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Change availability" }));
}

async function chooseUnavailable(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: "Availability" }));
  await user.click(
    await screen.findByRole("option", { name: "Not available for sale" }),
  );
}

describe("branch product availability form", () => {
  it("saves availability separately and refreshes the listing", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<BranchProductOperationAction>()
      .mockResolvedValue({ ok: true });
    renderAvailability(action);

    await openAvailability(user);
    await chooseUnavailable(user);
    await user.click(screen.getByRole("button", { name: "Save availability" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(branchId, productId, {
        is_available: false,
      }),
    );
    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toBe("Availability saved.");
  });

  it("keeps availability read-only for inactive products or without permission", () => {
    const action = vi.fn<BranchProductOperationAction>().mockResolvedValue({
      ok: true,
    });
    const { rerender } = renderAvailability(action, {
      isAvailable: false,
      productIsActive: false,
    });
    expect(
      screen.queryByRole("button", { name: "Change availability" }),
    ).toBeNull();

    rerender(
      <BranchProductAvailabilityForm
        branchId={branchId}
        productId={productId}
        productName="Chicken sandwich"
        isAvailable
        productIsActive={false}
        canUpdate
        action={action}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Change availability" }),
    ).toBeNull();

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
    expect(
      screen.queryByRole("button", { name: "Change availability" }),
    ).toBeNull();
    expect(action).not.toHaveBeenCalled();
  });

  it("confirms a dirty availability change before closing", async () => {
    const user = userEvent.setup();
    renderAvailability(
      vi.fn<BranchProductOperationAction>().mockResolvedValue({ ok: true }),
    );

    await openAvailability(user);
    await chooseUnavailable(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      await screen.findByRole("alertdialog", {
        name: "Discard unsaved availability changes?",
      }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(
      screen.getByRole("combobox", { name: "Availability" }).textContent,
    ).toContain("Not available for sale");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(
      screen.queryByRole("dialog", { name: "Change availability" }),
    ).toBeNull();
  });
});
