// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useQuickCreateDialog } from "./use-quick-create-dialog";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

function Probe() {
  const { open, openDialog, closeDialog } = useQuickCreateDialog();
  return (
    <div>
      <span>{open ? "open" : "closed"}</span>
      <button type="button" onClick={openDialog}>
        Open
      </button>
      <button type="button" onClick={closeDialog}>
        Close
      </button>
    </div>
  );
}

describe("quick create dialog URL state", () => {
  it("opens from the sidebar link and clears only the create flag when closed", async () => {
    window.history.replaceState(null, "", "/receipts?status=DRAFT&create=1");
    const user = userEvent.setup();
    render(<Probe />);

    await waitFor(() => expect(screen.getByText("open")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.getByText("closed")).toBeTruthy();
    expect(window.location.pathname + window.location.search).toBe(
      "/receipts?status=DRAFT",
    );
  });
});
