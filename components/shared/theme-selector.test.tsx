// @vitest-environment jsdom
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSelector } from "./theme-selector";

let dark = false;
let listeners: Set<(event: { matches: boolean }) => void>;
beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  dark = false;
  listeners = new Set();
  window.matchMedia = vi.fn().mockImplementation((media: string) => ({
    media,
    matches: media.includes("prefers-color-scheme") && dark,
    addListener: (fn: (event: { matches: boolean }) => void) =>
      listeners.add(fn),
    removeListener: (fn: (event: { matches: boolean }) => void) =>
      listeners.delete(fn),
    addEventListener() {},
    removeEventListener() {},
  }));
});
function setup() {
  return render(
    <ThemeProvider>
      <ThemeSelector />
      <input aria-label="Name" />
    </ThemeProvider>,
  );
}
async function select(name: string) {
  screen.getByRole("button", { name: "Change theme" }).focus();
  await userEvent.keyboard("{Enter}");
  await userEvent.click(screen.getByRole("menuitemradio", { name }));
  await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
}
it("offers keyboard-accessible Light, Dark and System choices and persists selection", async () => {
  const view = setup();
  await select("Dark");
  expect(document.documentElement.classList.contains("dark")).toBe(true);
  expect(localStorage.getItem("theme")).toBe("dark");
  view.unmount();
  setup();
  const trigger = screen.getByRole("button", { name: "Change theme" });
  trigger.focus();
  await userEvent.keyboard("{Enter}");
  expect(
    screen
      .getByRole("menuitemradio", { name: "Dark" })
      .getAttribute("aria-checked"),
  ).toBe("true");
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  await select("Light");
  expect(localStorage.getItem("theme")).toBe("light");
});
it("follows OS changes only in System mode and removes the D shortcut", async () => {
  setup();
  act(() => {
    dark = true;
    listeners.forEach((fn) => fn({ matches: true }));
  });
  expect(document.documentElement.classList.contains("dark")).toBe(true);
  await select("Light");
  act(() => listeners.forEach((fn) => fn({ matches: true })));
  expect(document.documentElement.classList.contains("light")).toBe(true);
  fireEvent.keyDown(window, { key: "d" });
  expect(document.documentElement.classList.contains("light")).toBe(true);
  await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "d");
  expect(document.documentElement.classList.contains("light")).toBe(true);
  await select("System");
  expect(localStorage.getItem("theme")).toBe("system");
  expect(document.documentElement.classList.contains("dark")).toBe(true);
});
