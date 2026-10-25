// @vitest-environment jsdom
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useNotificationCount, useReadNotification } from "./use-notifications";
import { NotificationBell } from "../components/notification-bell";
import { notificationKeys } from "../query-keys";
import { installToastBrowserMocks } from "@/test/toast-browser-mocks";
import { Toaster, toast } from "@/components/ui/toast";

const mocks = vi.hoisted(() => ({
  count: vi.fn(),
  list: vi.fn(),
  read: vi.fn(),
}));
vi.mock("../services/notification-actions", () => ({
  getNotificationCountAction: mocks.count,
  getNotificationsAction: mocks.list,
  markNotificationReadAction: mocks.read,
}));
const clients: QueryClient[] = [];
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>
        {children}
        <Toaster />
      </QueryClientProvider>
    ),
  };
}
beforeEach(() => {
  installToastBrowserMocks();
  toast.clear();
  vi.resetAllMocks();
  focusManager.setFocused(true);
  mocks.count.mockResolvedValue({ ok: true, data: { unread_count: 2 } });
  mocks.list.mockResolvedValue({
    ok: true,
    data: { items: [], total: 0, page: 1, page_size: 10 },
  });
  mocks.read.mockResolvedValue({ ok: true, data: { updated: true } });
});
afterEach(() => {
  act(() => toast.clear());
  clients.splice(0).forEach((client) => client.clear());
  focusManager.setFocused(undefined);
  vi.useRealTimers();
});

it("loads the list only when the bell opens and exposes a readable unread count", async () => {
  const { wrapper } = setup();
  render(<NotificationBell userId="staff" />, { wrapper });
  const bell = await screen.findByRole("button", {
    name: "Notifications, 2 unread",
  });
  expect(mocks.list).not.toHaveBeenCalled();
  await userEvent.click(bell);
  expect(await screen.findByText("No notifications yet")).toBeTruthy();
  expect(mocks.list).toHaveBeenCalledWith("staff", {
    status: "all",
    type: "all",
    page: 1,
    page_size: 10,
  });
  expect(
    screen
      .getByRole("link", { name: "View all notifications" })
      .getAttribute("href"),
  ).toBe("/notifications");
});

it("polls every 30 seconds only while focused and refetches on return", async () => {
  vi.useFakeTimers();
  const { wrapper } = setup();
  renderHook(() => useNotificationCount("staff"), { wrapper });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10);
  });
  const initial = mocks.count.mock.calls.length;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30000);
  });
  expect(mocks.count.mock.calls.length).toBe(initial + 1);
  act(() => focusManager.setFocused(false));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(mocks.count.mock.calls.length).toBe(initial + 1);
  await act(async () => {
    focusManager.setFocused(true);
    await vi.advanceTimersByTimeAsync(10);
  });
  expect(mocks.count.mock.calls.length).toBe(initial + 2);
});

it("does not expose another user's cached count", async () => {
  mocks.count.mockImplementation(async (user: string) => ({
    ok: true,
    data: { unread_count: user === "a" ? 7 : 1 },
  }));
  const { wrapper } = setup();
  const { result, rerender } = renderHook(
    ({ user }) => useNotificationCount(user),
    { wrapper, initialProps: { user: "a" } },
  );
  await waitFor(() => expect(result.current.data?.unread_count).toBe(7));
  rerender({ user: "b" });
  expect(result.current.data?.unread_count).not.toBe(7);
  await waitFor(() => expect(result.current.data?.unread_count).toBe(1));
});

it("retains unread state after a failed read and refreshes after a successful retry", async () => {
  const { wrapper, client } = setup();
  client.setQueryData(notificationKeys.count("staff"), { unread_count: 2 });
  mocks.read.mockResolvedValueOnce({
    ok: false,
    status: 503,
    error: "Unavailable",
  });
  const { result } = renderHook(() => useReadNotification("staff"), {
    wrapper,
  });
  await act(async () => {
    await expect(result.current.mutateAsync(undefined)).rejects.toThrow(
      "Unavailable",
    );
  });
  expect(client.getQueryData(notificationKeys.count("staff"))).toEqual({
    unread_count: 2,
  });
  expect(
    await screen.findByText(
      "Could not mark notifications as read. Please try again.",
    ),
  ).toBeTruthy();
  await act(async () => {
    await result.current.mutateAsync(undefined);
  });
  expect(
    client.getQueryState(notificationKeys.count("staff"))?.isInvalidated,
  ).toBe(true);
});

it("does not display a false zero when counts fail", async () => {
  mocks.count.mockResolvedValue({
    ok: false,
    status: 403,
    error: "Access changed",
  });
  const { wrapper } = setup();
  render(<NotificationBell userId="staff" />, { wrapper });
  expect(
    await screen.findByRole("button", {
      name: "Notifications, count unavailable",
    }),
  ).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: "Notifications, 0 unread" }),
  ).toBeNull();
});
