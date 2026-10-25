// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installToastBrowserMocks } from "@/test/toast-browser-mocks";
import { toast, Toaster } from "./toast";

beforeEach(() => {
  installToastBrowserMocks();
  vi.useFakeTimers();
  toast.clear();
});
afterEach(() => {
  act(() => toast.clear());
  vi.useRealTimers();
});
const advance = async (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

describe("COMS Sileo integration", () => {
  it("keeps independent messages and queues the fourth until a slot is available", async () => {
    render(<Toaster />);
    const ids: string[] = [];
    act(() => {
      for (const title of ["First", "Second", "Third", "Fourth"])
        ids.push(toast.add({ title, type: "success" }));
    });
    expect(new Set(ids).size).toBe(4);
    expect(screen.getAllByRole("status")).toHaveLength(3);
    expect(screen.queryByText("Fourth")).toBeNull();
    await advance(5000);
    act(() => toast.dismiss(ids[0]));
    await advance(600);
    expect(screen.getByText("Fourth")).toBeTruthy();
    await advance(6000);
    expect(
      screen
        .getByText("Fourth")
        .closest("[data-sileo-toast]")
        ?.getAttribute("data-exiting"),
    ).toBe("true");
    await advance(600);
    expect(screen.queryByText("Fourth")).toBeNull();
  });

  it("preserves long messages and descriptions with the right severity and duration", async () => {
    render(<Toaster />);
    const message = "COMS could not reach the server. Try again.";
    act(() => {
      toast.add({ title: "Saved", type: "success" });
      toast.add({
        title: message,
        description: "Your work is still here.",
        type: "error",
      });
    });
    await advance(200);
    const error = screen.getByRole("alert");
    expect(within(error).getByText(message)).toBeTruthy();
    expect(within(error).getByText("Your work is still here.")).toBeTruthy();
    expect(error.getAttribute("data-expanded")).toBe("true");
    await advance(6400);
    expect(screen.queryByText("Saved")).toBeNull();
    expect(error.getAttribute("data-exiting")).toBe("false");
    await advance(2000);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("pauses while hovered or focused and resumes the remaining time", async () => {
    render(<Toaster />);
    act(() => toast.add({ title: "Saved", type: "success" }));
    await advance(2000);
    const viewport = document.querySelector("[data-sileo-viewport]")!;
    fireEvent.mouseEnter(viewport);
    const close = screen.getByRole("button", { name: "Dismiss notification" });
    fireEvent.focus(close);
    await advance(10000);
    fireEvent.mouseLeave(viewport);
    await advance(10000);
    expect(screen.getByText("Saved")).toBeTruthy();
    fireEvent.blur(close, { relatedTarget: document.body });
    await advance(3999);
    expect(screen.getByRole("status").getAttribute("data-exiting")).toBe(
      "false",
    );
    await advance(601);
    expect(screen.queryByText("Saved")).toBeNull();
  });

  it("supports a close button and focused Escape without nested interactive controls", async () => {
    render(<Toaster />);
    act(() => toast.add({ title: "Saved", type: "success" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    await advance(600);
    expect(screen.queryByText("Saved")).toBeNull();
    act(() => toast.add({ title: "Please review", type: "warning" }));
    fireEvent.keyDown(screen.getByRole("status"), { key: "Escape" });
    await advance(600);
    expect(screen.queryByText("Please review")).toBeNull();
    expect(document.querySelector("button button, button a")).toBeNull();
  });

  it("retains a toast emitted before the renderer subscribes and cleans timers on unmount", async () => {
    toast.add({ title: "Before mount", type: "info" });
    const view = render(<Toaster />);
    expect(screen.getByText("Before mount")).toBeTruthy();
    view.unmount();
    await advance(9000);
    render(<Toaster />);
    expect(screen.getByText("Before mount")).toBeTruthy();
  });

  it("does not leave future notifications paused after a focused toast is dismissed", async () => {
    render(<Toaster />);
    act(() => toast.add({ title: "First", type: "success" }));
    act(() =>
      screen.getByRole("button", { name: "Dismiss notification" }).focus(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    await advance(600);
    act(() => toast.add({ title: "Next", type: "success" }));
    await advance(6600);
    expect(screen.queryByText("Next")).toBeNull();
  });
});
