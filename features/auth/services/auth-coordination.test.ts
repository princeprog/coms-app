// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const actions = vi.hoisted(() => ({
  currentUserAction: vi.fn(),
  loginAction: vi.fn(),
  logoutAction: vi.fn(),
}));
vi.mock("./auth-actions", () => actions);
import { getCurrentUser, refreshSession, login, logout } from "./auth-client";
import {
  AUTH_LOCK_NAME,
  withAuthLock,
  subscribeToLogout,
} from "./auth-coordination";

describe("browser auth coordination", () => {
  let request: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.clearAllMocks();
    let queue = Promise.resolve();
    request = vi.fn((_name, _options, work) => {
      const current = queue.then(work);
      queue = current.catch(() => {});
      return current;
    });
    vi.stubGlobal("navigator", { locks: { request } });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  it("deduplicates automatic and explicit recovery in one tab", async () => {
    actions.currentUserAction.mockResolvedValue({
      ok: true,
      data: { id: "u1" },
    });
    const [user, recovered] = await Promise.all([
      getCurrentUser(),
      refreshSession(),
      getCurrentUser(),
    ]);
    expect(user).toEqual({ id: "u1" });
    expect(recovered).toEqual({ user });
    expect(actions.currentUserAction).toHaveBeenCalledTimes(1);
    expect(actions.currentUserAction).toHaveBeenCalledWith(true);
    expect(request).toHaveBeenCalledWith(
      AUTH_LOCK_NAME,
      expect.objectContaining({ mode: "exclusive" }),
      expect.any(Function),
    );
  });
  it("serializes login, recovery and logout using the same lock", async () => {
    const order: string[] = [];
    actions.loginAction.mockImplementation(async () => {
      order.push("login");
      return { ok: true, data: {} };
    });
    actions.currentUserAction.mockImplementation(async () => {
      order.push("me");
      return { ok: true, data: null };
    });
    actions.logoutAction.mockImplementation(async () => {
      order.push("logout");
      return { ok: true };
    });
    await Promise.all([
      login({ email: "a@b.test", password: "test" }),
      getCurrentUser(),
      logout(),
    ]);
    expect(order).toEqual(["login", "me", "logout"]);
    expect(
      request.mock.calls.every(
        ([name, options]) => name === AUTH_LOCK_NAME && !options.steal,
      ),
    ).toBe(true);
  });
  it("bounds lock waiting to 30 seconds without executing or stealing", async () => {
    vi.useFakeTimers();
    const operation = vi.fn();
    request.mockImplementation(
      (_name, { signal }) =>
        new Promise((_, reject) => {
          signal.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    const check = expect(withAuthLock(operation)).rejects.toMatchObject({
      status: 408,
    });
    await vi.advanceTimersByTimeAsync(30000);
    await check;
    expect(operation).not.toHaveBeenCalled();
  });
  it("does not abort a lock after it has been acquired", async () => {
    vi.useFakeTimers();
    let release!: () => void;
    const held = withAuthLock(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    await vi.advanceTimersByTimeAsync(31000);
    expect(request.mock.calls[0][1].signal.aborted).toBe(false);
    release();
    await held;
  });
  it("disables rotation without Web Locks and still permits explicit logout", async () => {
    vi.stubGlobal("navigator", {});
    actions.currentUserAction.mockResolvedValue({
      ok: false,
      status: 428,
      message: "Sign in again",
    });
    actions.logoutAction.mockResolvedValue({ ok: true });
    await expect(refreshSession()).rejects.toMatchObject({ status: 428 });
    expect(actions.currentUserAction).toHaveBeenCalledWith(false);
    await logout();
    expect(actions.logoutAction).toHaveBeenCalledTimes(1);
  });
  it("never retries a failed token-changing operation", async () => {
    actions.logoutAction.mockResolvedValue({
      ok: false,
      status: 503,
      message: "unavailable",
    });
    await expect(logout()).rejects.toMatchObject({ status: 503 });
    expect(actions.logoutAction).toHaveBeenCalledTimes(1);
  });

  it("completes logout when browser privacy rules block BroadcastChannel", async () => {
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        constructor() {
          throw new DOMException("Blocked", "SecurityError");
        }
      },
    );
    actions.logoutAction.mockResolvedValue({ ok: true });
    await expect(logout()).resolves.toBeUndefined();
    expect(() => subscribeToLogout(vi.fn())()).not.toThrow();
  });

  it("closes a failed broadcast without changing a successful logout", async () => {
    const close = vi.fn();
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        close = close;
        postMessage() {
          throw new Error("Messaging unavailable");
        }
      },
    );
    actions.logoutAction.mockResolvedValue({ ok: true });
    await expect(logout()).resolves.toBeUndefined();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
