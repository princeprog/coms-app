// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PosBranchSelector } from "./pos-branch-selector";

vi.mock("next/form", () => ({
  default: ({ children, ...props }: React.ComponentProps<"form">) => (
    <form {...props}>{children}</form>
  ),
}));

const downtownId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const airportId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";

describe("POS branch selector", () => {
  it("uses client GET navigation and submits only the chosen branch", async () => {
    const user = userEvent.setup();
    render(
      <PosBranchSelector
        branches={[
          { id: downtownId, name: "Downtown", status: "active" },
          { id: airportId, name: "Airport", status: "inactive" },
        ]}
        selectedBranchId={downtownId}
      />,
    );

    const form = screen.getByRole("form", { name: "Choose sales branch" });
    expect(form.getAttribute("action")).toBe("/pos");
    expect(form.hasAttribute("method")).toBe(false);
    expect(form.querySelector('input[name="page"]')).toBeNull();
    expect(
      form.querySelector<HTMLInputElement>('input[name="branch_id"]')?.value,
    ).toBe(downtownId);

    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(
      await screen.findByRole("option", { name: "Airport (inactive)" }),
    );

    expect(
      form.querySelector<HTMLInputElement>('input[name="branch_id"]')?.value,
    ).toBe(airportId);
    expect(screen.getByRole("button", { name: "Open branch" })).toBeTruthy();
  });
});
