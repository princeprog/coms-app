// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

describe("Dialog", () => {
  it("forwards the optional overlay class to the dialog backdrop", async () => {
    render(
      <Dialog open>
        <DialogContent overlayClassName="test-backdrop">
          <DialogTitle>Example dialog</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="dialog-overlay"]')?.classList,
      ).toContain("test-backdrop"),
    );
    expect(screen.getByRole("dialog", { name: "Example dialog" })).toBeTruthy();
  });
});
