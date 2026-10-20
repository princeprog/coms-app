// @vitest-environment jsdom
import { act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { NotificationInbox } from "./notification-inbox";
import { notificationKeys } from "../query-keys";
const mocks = vi.hoisted(() => ({
  params: new URLSearchParams(),
  router: { replace: vi.fn() },
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => mocks.params,
  useRouter: () => mocks.router,
}));
vi.mock("../services/notification-actions", () => ({
  getNotificationsAction: () => new Promise(() => {}),
  getNotificationCountAction: () => new Promise(() => {}),
  markNotificationReadAction: vi.fn(),
}));

it("hydrates consistently when the header has already fetched the shared unread count", async () => {
  const serverClient = new QueryClient();
  const client = new QueryClient();
  const content = (queryClient: QueryClient) => (
    <QueryClientProvider client={queryClient}>
      <NotificationInbox userId="staff" />
    </QueryClientProvider>
  );
  const container = document.createElement("div");
  container.innerHTML = renderToString(content(serverClient));
  document.body.append(container);
  client.setQueryData(notificationKeys.count("staff"), { unread_count: 26 });
  const errors: unknown[] = [];
  let root!: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, content(client), {
      onRecoverableError: (error) => errors.push(error),
    });
  });
  await act(async () => root.unmount());
  serverClient.clear();
  client.clear();
  container.remove();
  expect(errors).toEqual([]);
});
