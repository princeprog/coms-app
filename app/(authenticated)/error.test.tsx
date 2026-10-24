// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { authTestSessionUser } from "@/test/auth-fixtures";
const mocks = vi.hoisted(() => ({
  refreshSession: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("@/features/auth/services/auth-client", () => ({
  refreshSession: mocks.refreshSession,
}));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
import AuthenticatedError from "./error";
import { ApiRequestError } from "@/services/api-services";
import { announceSessionRecovery } from "@/features/auth/services/auth-coordination";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("restores the session before resetting the failed page and refetches server content", async () => {
  let restored!: (value: { user: typeof authTestSessionUser }) => void;
  mocks.refreshSession.mockReturnValue(
    new Promise((resolve) => {
      restored = resolve;
    }),
  );
  const reset = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthenticatedError reset={reset} />
    </QueryClientProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(reset).not.toHaveBeenCalled();
  expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  await act(async () => {
    restored({ user: authTestSessionUser });
  });
  await waitFor(() => expect(reset).toHaveBeenCalledTimes(1));
  expect(mocks.refresh).toHaveBeenCalled();
});

it("keeps retry available after an outage instead of resetting into the same failed response", async () => {
  mocks.refreshSession.mockRejectedValue(
    new ApiRequestError("Unavailable", 503),
  );
  const reset = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthenticatedError reset={reset} />
    </QueryClientProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByText(/could not restore your session/i);
  expect(reset).not.toHaveBeenCalled();
  expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(
    false,
  );
});

it("automatically resets a stale page when background recovery succeeds", () => {
  const reset = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthenticatedError reset={reset} />
    </QueryClientProvider>,
  );
  act(() => announceSessionRecovery());
  expect(reset).toHaveBeenCalledTimes(1);
  expect(mocks.refresh).toHaveBeenCalled();
});
