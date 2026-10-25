// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PwaContext, type PwaContextValue } from "./pwa-provider";
import { PwaNotice } from "./pwa-notice";

function state(overrides: Partial<PwaContextValue> = {}): PwaContextValue {
  return {
    supported: true,
    offlineStatus: { ready: true, cachedAssets: 1, totalAssets: 1 },
    updateAvailable: false,
    error: null,
    applying: false,
    updated: false,
    applyUpdate: vi.fn(),
    refreshOfflineStatus: vi.fn(),
    install: {
      available: true,
      instructions: null,
      installing: false,
      install: vi.fn(),
    },
    sidebarPlacement: false,
    setSidebarPlacement: vi.fn(),
    ...overrides,
  } as PwaContextValue;
}
function show(value: PwaContextValue) {
  return render(
    <PwaContext.Provider value={value}>
      <PwaNotice placement="floating" />
    </PwaContext.Provider>,
  );
}
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("COMS app notice", () => {
  it("offers installation with the mascot and installs on request", () => {
    const value = state();
    show(value);
    expect(
      screen.getByRole("img", { name: "Emma's Chicken House mascot" }),
    ).toBeTruthy();
    expect(screen.getByText("Get the COMS app")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Install COMS" }));
    expect(value.install.install).toHaveBeenCalled();
  });
  it("hides the install offer on this browser when closed", () => {
    show(state());
    fireEvent.click(screen.getByRole("button", { name: "Hide install offer" }));
    expect(screen.queryByText("Get the COMS app")).toBeNull();
    cleanup();
    show(state());
    expect(screen.queryByText("Get the COMS app")).toBeNull();
  });
  it("shows an available update before the install offer and closes it for this visit only", () => {
    const value = state({ updateAvailable: true });
    show(value);
    expect(screen.getByText("Update ready")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Update COMS" }));
    expect(value.applyUpdate).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Hide update notice" }));
    expect(screen.queryByText("Update ready")).toBeNull();
    expect(localStorage.length).toBe(0);
  });
  it("renders nothing when there is nothing to offer", () => {
    const { container } = show(
      state({
        install: {
          available: false,
          instructions: null,
          installing: false,
          install: vi.fn(),
        },
      }),
    );
    expect(container.innerHTML).toBe("");
  });
});
