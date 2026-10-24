// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { authTestSessionUser } from "@/test/auth-fixtures";
import { AuthQuerySeed } from "./auth-query-seed";
const mocks = vi.hoisted(() => ({
  check: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("@/features/auth/services/auth-client", () => ({
  getCurrentUser: mocks.check,
}));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

it("checks an idle authenticated session repeatedly without remounting the shell", async () => {
  vi.useFakeTimers();
  mocks.check.mockResolvedValue(authTestSessionUser);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <AuthQuerySeed user={authTestSessionUser} />
    </QueryClientProvider>,
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(180_000);
  });
  expect(mocks.check.mock.calls.length).toBeGreaterThanOrEqual(3);
  client.clear();
});
