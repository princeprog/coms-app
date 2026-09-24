// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OperationalLoadError } from "./operational-load-error";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

describe("OperationalLoadError", () => {
  it("offers a retry action that refreshes the current route", async () => {
    const user = userEvent.setup();
    render(
      <OperationalLoadError
        title="Branches"
        description="COMS could not load the branch list."
      />,
    );

    expect(screen.getByRole("alert").textContent).toContain("branch list");
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
