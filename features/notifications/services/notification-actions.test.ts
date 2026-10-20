import { beforeEach, expect, it, vi } from "vitest";
import {
  getNotificationsAction,
  getNotificationCountAction,
  markNotificationReadAction,
} from "./notification-actions";
const mocks = vi.hoisted(() => ({ session: vi.fn(), request: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "coms_access=test" }),
}));
vi.mock("@/features/auth/services/auth-server", () => ({
  getCurrentUserFromServer: mocks.session,
}));
vi.mock("@/services/server-api-services", () => ({
  requestComsApi: mocks.request,
}));
const filters = { status: "unread", type: "reports", page: 2, page_size: 30 };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({
    status: "authenticated",
    user: { id: "staff" },
  });
});
it("relays validated server pagination and filters with the session cookie", async () => {
  mocks.request.mockResolvedValue({
    items: [],
    total: 0,
    page: 2,
    page_size: 30,
  });
  expect((await getNotificationsAction("staff", filters)).ok).toBe(true);
  expect(mocks.request).toHaveBeenCalledWith(
    "/notifications?status=unread&type=reports&page=2&page_size=30",
    { method: "GET", cookieHeader: "coms_access=test" },
  );
});
it("rejects an old user's requests after the signed-in identity changes", async () => {
  expect((await getNotificationCountAction("previous-user")).ok).toBe(false);
  expect((await markNotificationReadAction("previous-user")).ok).toBe(false);
  expect(mocks.request).not.toHaveBeenCalled();
});
it("rejects invalid filters and ids without invoking the API", async () => {
  expect(
    (await getNotificationsAction("staff", { ...filters, page_size: 500 })).ok,
  ).toBe(false);
  expect((await markNotificationReadAction("staff", "invalid")).ok).toBe(false);
  expect(mocks.request).not.toHaveBeenCalled();
});
it("treats malformed count responses as an error instead of zero", async () => {
  mocks.request.mockResolvedValue({ unread_count: "unknown" });
  expect((await getNotificationCountAction("staff")).ok).toBe(false);
});
