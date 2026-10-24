// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useNotificationSound } from "./use-notification-sound";
import { useNotificationSoundPreference } from "./use-notification-sound-preference";
const mocks = vi.hoisted(() => ({
  play: vi.fn(),
  unlock: vi.fn(),
  state: {
    data: undefined as
      { unread_count: number; latest_unread_at?: string | null } | undefined,
    isError: false,
  },
}));
vi.mock("./use-notifications", () => ({
  useNotificationCount: () => mocks.state,
}));
vi.mock("../services/notification-sound", () => ({
  playNotificationChime: mocks.play,
  unlockNotificationAudio: mocks.unlock,
}));
const at = (minute: number) =>
  new Date(Date.UTC(2026, 9, 24, 10, minute)).toISOString();
const data = (minute: number | null, count = 2) => ({
  unread_count: count,
  latest_unread_at: minute === null ? null : at(minute),
});
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.state = { data: data(1), isError: false };
  vi.spyOn(document, "hasFocus").mockReturnValue(true);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
});
afterEach(() => vi.restoreAllMocks());
describe("notification sound", () => {
  it("is silent on first load, sounds once for a new timestamp even at the same unread count", () => {
    const { rerender } = renderHook(() => useNotificationSound("a"));
    expect(mocks.play).not.toHaveBeenCalled();
    mocks.state.data = data(2);
    rerender();
    expect(mocks.play).toHaveBeenCalledTimes(1);
    mocks.state.data = data(2);
    rerender();
    expect(mocks.play).toHaveBeenCalledTimes(1);
  });
  it("does not sound when reading changes which unread notification is newest", () => {
    const { rerender } = renderHook(() => useNotificationSound("a"));
    mocks.state.data = data(null, 0);
    rerender();
    mocks.state.data = data(0, 1);
    rerender();
    mocks.state.data = data(2, 1);
    rerender();
    expect(mocks.play).toHaveBeenCalledTimes(1);
  });
  it("keeps old notifications silent after navigation rerenders and identity changes", () => {
    const { rerender } = renderHook(({ user }) => useNotificationSound(user), {
      initialProps: { user: "a" },
    });
    rerender({ user: "a" });
    mocks.state.data = data(3, 7);
    rerender({ user: "b" });
    expect(mocks.play).not.toHaveBeenCalled();
  });
  it("does not play from unfocused or hidden tabs, or replay their skipped alerts", () => {
    const focus = vi.mocked(document.hasFocus);
    const { rerender } = renderHook(() => useNotificationSound("a"));
    focus.mockReturnValue(false);
    mocks.state.data = data(2);
    rerender();
    focus.mockReturnValue(true);
    mocks.state.data = data(2);
    rerender();
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    mocks.state.data = data(3);
    rerender();
    expect(mocks.play).not.toHaveBeenCalled();
  });
  it("persists mute per user and does not replay muted arrivals on enabling", () => {
    const pref = renderHook(() => useNotificationSoundPreference("a"));
    act(() => pref.result.current.setEnabled(false));
    expect(pref.result.current.enabled).toBe(false);
    const { rerender } = renderHook(() => useNotificationSound("a"));
    mocks.state.data = data(2);
    rerender();
    act(() => pref.result.current.setEnabled(true));
    mocks.state.data = data(2);
    rerender();
    expect(mocks.play).not.toHaveBeenCalled();
    mocks.state.data = data(3);
    rerender();
    expect(mocks.play).toHaveBeenCalledTimes(1);
    act(() => pref.result.current.setEnabled(false));
    pref.unmount();
    expect(
      renderHook(() => useNotificationSoundPreference("a")).result.current
        .enabled,
    ).toBe(false);
    expect(
      renderHook(() => useNotificationSoundPreference("b")).result.current
        .enabled,
    ).toBe(true);
  });
  it("unlocks audio on interaction only when sound is enabled and cleans up listeners", () => {
    const { unmount } = renderHook(() => useNotificationSound("a"));
    window.dispatchEvent(new Event("pointerdown"));
    expect(mocks.unlock).toHaveBeenCalledTimes(1);
    localStorage.setItem("coms:notification-sound:v1:a", "muted");
    window.dispatchEvent(new Event("keydown"));
    expect(mocks.unlock).toHaveBeenCalledTimes(1);
    unmount();
    localStorage.clear();
    window.dispatchEvent(new Event("pointerdown"));
    expect(mocks.unlock).toHaveBeenCalledTimes(1);
  });
  it("ignores errors and supports count-only API responses", () => {
    mocks.state.data = { unread_count: 2 };
    const { rerender } = renderHook(() => useNotificationSound("a"));
    mocks.state = { data: { unread_count: 3 }, isError: true };
    rerender();
    expect(mocks.play).not.toHaveBeenCalled();
    mocks.state.isError = false;
    rerender();
    expect(mocks.play).toHaveBeenCalledTimes(1);
  });
  it("keeps the toggle functional when browser storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(() =>
      useNotificationSoundPreference("storage-blocked"),
    );
    act(() => result.current.setEnabled(false));
    expect(result.current.enabled).toBe(false);
    act(() => result.current.setEnabled(true));
    expect(result.current.enabled).toBe(true);
  });
});
