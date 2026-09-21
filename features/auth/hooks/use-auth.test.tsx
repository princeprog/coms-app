// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { routerMock, loginMock, logoutMock, refreshMock, getCurrentUserMock } =
  vi.hoisted(() => ({
    routerMock: {
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
    },
    loginMock: vi.fn(),
    logoutMock: vi.fn(),
    refreshMock: vi.fn(),
    getCurrentUserMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({ useRouter: () => routerMock }));
vi.mock("@/features/auth/services/auth-client", () => ({
  AuthApiError: class AuthApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message);
    }
  },
  login: loginMock,
  logout: logoutMock,
  refreshSession: refreshMock,
  getCurrentUser: getCurrentUserMock,
}));

import { authKeys } from "@/features/auth/query-keys";
import {
  useCurrentUser,
  useLogin,
  useLogout,
  useRefreshSession,
} from "./use-auth";

const user = {
  id: "u1",
  email: "staff@example.com",
  full_name: "Staff Member",
  contact_number: "09170000000",
};

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("auth mutations", () => {
  beforeEach(() => {
    loginMock.mockReset();
    logoutMock.mockReset();
    refreshMock.mockReset();
    getCurrentUserMock.mockReset();
    routerMock.push.mockReset();
    routerMock.replace.mockReset();
    routerMock.refresh.mockReset();
  });

  it("seeds the current-user cache and navigates after login", async () => {
    loginMock.mockResolvedValue({ user });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        email: user.email,
        password: "secret",
      });
    });

    expect(queryClient.getQueryData(authKeys.me)).toEqual(user);
    expect(routerMock.push).toHaveBeenCalledWith("/dashboard");
  });

  it("clears the auth cache and navigates home after logout", async () => {
    logoutMock.mockResolvedValue(undefined);
    const queryClient = new QueryClient();
    queryClient.setQueryData(authKeys.me, user);
    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    await waitFor(() =>
      expect(queryClient.getQueryData(authKeys.me)).toBeUndefined(),
    );
    expect(routerMock.replace).toHaveBeenCalledWith("/");
  });

  it("seeds the cache and refreshes the route after token rotation", async () => {
    refreshMock.mockResolvedValue({ user });
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useRefreshSession(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(queryClient.getQueryData(authKeys.me)).toEqual(user);
    expect(routerMock.refresh).toHaveBeenCalled();
  });

  it("keeps the session cache and exposes a logout error when logout fails", async () => {
    logoutMock.mockRejectedValue(new Error("offline"));
    const queryClient = new QueryClient();
    queryClient.setQueryData(authKeys.me, user);
    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow("offline");
    });

    expect(queryClient.getQueryData(authKeys.me)).toEqual(user);
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it("uses the auth me key and does not retry a rejected session query", async () => {
    getCurrentUserMock.mockRejectedValue(new Error("service unavailable"));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: 3 } },
    });
    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(getCurrentUserMock).toHaveBeenCalledTimes(1);
    expect(
      queryClient.getQueryCache().find({ queryKey: authKeys.me }),
    ).toBeDefined();
  });
});
