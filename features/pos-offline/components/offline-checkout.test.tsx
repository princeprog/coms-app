// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OfflineRegister } from "../hooks/use-offline-register";
import { registerFixture, recoveryFixture } from "../hooks/offline-ui-fixture";
import { OfflineCheckout } from "./offline-checkout";
vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));
function controller(): OfflineRegister {
  return {
    pending: false,
    readOnly: false,
    error: "",
    checkout: vi.fn(),
    saveCart: vi.fn(),
    sync: vi.fn(),
  } as unknown as OfflineRegister;
}
afterEach(() => vi.restoreAllMocks());
describe("prepared checkout safety", () => {
  it("blocks checkout at the exact business cutoff without clearing the cart", () => {
    vi.spyOn(Date, "now").mockReturnValue(
      Date.parse("2026-10-26T10:00:00.000Z"),
    );
    const register = controller();
    render(<OfflineCheckout register={register} state={registerFixture()} />);
    expect(screen.getByRole("alert").textContent).toContain(
      "business day has ended",
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Complete sale",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.submit(screen.getByRole("form", { name: "POS checkout" }));
    expect(register.checkout).not.toHaveBeenCalled();
    expect(register.saveCart).not.toHaveBeenCalled();
    expect(screen.getAllByText("Chicken").length).toBeGreaterThan(0);
  });
  it("does not checkout from the second tab", () => {
    vi.spyOn(Date, "now").mockReturnValue(
      Date.parse("2026-10-26T02:00:00.000Z"),
    );
    const register = { ...controller(), readOnly: true };
    render(<OfflineCheckout register={register} state={registerFixture()} />);
    fireEvent.submit(screen.getByRole("form", { name: "POS checkout" }));
    expect(register.checkout).not.toHaveBeenCalled();
  });
  it("changes the pending receipt to the server reference after acknowledgement", async () => {
    vi.spyOn(Date, "now").mockReturnValue(
      Date.parse("2026-10-26T02:00:00.000Z"),
    );
    const record = {
      ...recoveryFixture().records[0],
      status: "PENDING" as const,
    };
    const register = controller();
    vi.mocked(register.checkout).mockResolvedValue(record);
    const state = registerFixture();
    const view = render(<OfflineCheckout register={register} state={state} />);
    fireEvent.submit(screen.getByRole("form", { name: "POS checkout" }));
    await waitFor(() => expect(screen.getByText(/Local sale 1/)).toBeTruthy());
    view.rerender(
      <OfflineCheckout
        register={register}
        state={{
          ...state,
          cart: { ...state.cart, items: [] },
          records: [
            {
              ...record,
              status: "ACKNOWLEDGED",
              result: {
                id: record.envelope.id,
                status: "ACKNOWLEDGED",
                sale_reference: "S-000123",
              },
            },
          ],
        }}
      />,
    );
    expect(screen.getByText(/Sale S-000123/).textContent).toContain(
      "Confirmed by COMS",
    );
    expect(screen.queryByText(/waiting for server confirmation/)).toBeNull();
  });
});
