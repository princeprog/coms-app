// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it } from "vitest";
import { OfflineRecoveryPanel } from "./offline-recovery-panel";
import { id } from "../hooks/offline-ui-fixture";
it("shows invalid recovery feedback and keeps finalization disabled", async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OfflineRecoveryPanel branchId={id(2)} />
    </QueryClientProvider>,
  );
  const file = new File(["{}"], "invalid.json", { type: "application/json" });
  Object.defineProperty(file, "text", { value: async () => "{}" });
  fireEvent.change(screen.getByLabelText("Recovery file"), {
    target: { files: [file] },
  });
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "valid complete COMS recovery file",
    ),
  );
  expect(
    (
      screen.getByRole("button", {
        name: "Finalize recovered register",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(screen.getByLabelText("Recovery reason")).toBeTruthy();
});
