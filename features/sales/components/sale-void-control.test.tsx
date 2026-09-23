// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SaleVoidControl } from "./sale-void-control";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const saleId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const firstKey = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const secondKey = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0b";
const action = vi.fn();

describe("sale void control", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    refresh.mockReset();
    action.mockReset();
  });

  it("requires a reason and reuses the void key for an unchanged retry", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce(firstKey)
        .mockReturnValueOnce(secondKey),
    });
    action
      .mockResolvedValueOnce({ ok: false, error: "Try again." })
      .mockResolvedValueOnce({ ok: true });
    render(
      <SaleVoidControl branchId={branchId} saleId={saleId} action={action} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Void sale" }));
    const confirm = screen.getByRole("button", { name: "Confirm void" });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Void reason"), {
      target: { value: "Cashier selected the wrong product" },
    });
    expect((confirm as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(confirm);
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("Try again."),
    );
    expect(action).toHaveBeenNthCalledWith(
      1,
      branchId,
      saleId,
      { reason: "Cashier selected the wrong product" },
      firstKey,
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirm void" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(action).toHaveBeenNthCalledWith(
      2,
      branchId,
      saleId,
      { reason: "Cashier selected the wrong product" },
      firstKey,
    );
  });
});
