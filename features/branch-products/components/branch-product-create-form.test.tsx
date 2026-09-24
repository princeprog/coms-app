// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BranchProductCreateAction } from "@/features/branch-products/components/branch-product-create-form";
import { BranchProductCreateForm } from "./branch-product-create-form";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const products = [{ id: productId, product_name: "Chicken sandwich" }];

afterEach(() => refresh.mockReset());

async function openCreate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Add offering" }));
}

async function chooseProduct(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: "Product *" }));
  await user.click(
    await screen.findByRole("option", { name: "Chicken sandwich" }),
  );
}

function renderCreate(action: BranchProductCreateAction) {
  return render(
    <BranchProductCreateForm
      branchId={branchId}
      branchName="Downtown"
      products={products}
      action={action}
    />,
  );
}

describe("branch product create form", () => {
  it("creates an offer with the selected product and exact price string", async () => {
    const user = userEvent.setup();
    const action = vi.fn<BranchProductCreateAction>().mockResolvedValue({
      ok: true,
    });
    renderCreate(action);

    await openCreate(user);
    await chooseProduct(user);
    await user.type(screen.getByLabelText("Offer price *"), "000.1250");
    await user.click(screen.getByRole("button", { name: "Create offering" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(branchId, {
        product_id: productId,
        price: "000.1250",
      }),
    );
    expect(refresh).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain(
      "Offer added to Downtown.",
    );
  });

  it("validates missing choices and malformed decimal prices", async () => {
    const user = userEvent.setup();
    const action = vi.fn<BranchProductCreateAction>().mockResolvedValue({
      ok: true,
    });
    renderCreate(action);

    await openCreate(user);
    await user.click(screen.getByRole("button", { name: "Create offering" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /select a product and enter a nonnegative decimal price/i,
    );

    await chooseProduct(user);
    await user.type(screen.getByLabelText("Offer price *"), "1e2");
    await user.click(screen.getByRole("button", { name: "Create offering" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /select a product and enter a nonnegative decimal price/i,
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("retains a failed create draft and retries the same values", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<BranchProductCreateAction>()
      .mockResolvedValueOnce({
        ok: false,
        error: "This product is already offered at the branch.",
      })
      .mockResolvedValue({ ok: true });
    renderCreate(action);

    await openCreate(user);
    await chooseProduct(user);
    await user.type(screen.getByLabelText("Offer price *"), "10.00");
    await user.click(screen.getByRole("button", { name: "Create offering" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "This product is already offered at the branch.",
    );
    expect(screen.getByLabelText("Offer price *")).toHaveProperty(
      "value",
      "10.00",
    );
    expect(
      screen.getByRole("combobox", { name: "Product *" }).textContent,
    ).toContain("Chicken sandwich");

    await user.click(screen.getByRole("button", { name: "Create offering" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(action).toHaveBeenLastCalledWith(branchId, {
      product_id: productId,
      price: "10.00",
    });
  });

  it("asks before discarding a dirty draft and retains it when kept", async () => {
    const user = userEvent.setup();
    renderCreate(
      vi.fn<BranchProductCreateAction>().mockResolvedValue({ ok: true }),
    );

    await openCreate(user);
    await user.type(screen.getByLabelText("Offer price *"), "15.00");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      await screen.findByRole("alertdialog", {
        name: "Discard unsaved offering?",
      }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText("Offer price *")).toHaveProperty(
      "value",
      "15.00",
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.queryByRole("dialog", { name: "Add offering" })).toBeNull();
  });
});
