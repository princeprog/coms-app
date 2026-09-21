import { afterEach, describe, expect, it, vi } from "vitest";

const { loginActionMock } = vi.hoisted(() => ({
  loginActionMock: vi.fn(),
}));

vi.mock("@/features/auth/services/auth-actions", () => ({
  loginAction: loginActionMock,
}));

import { login } from "./auth-client";

describe("auth-client", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the auth feature server service", async () => {
    loginActionMock.mockResolvedValue({
      ok: true,
      data: { user: { id: "u1" } },
    });

    await login({ email: "staff@example.com", password: "secret" });

    expect(loginActionMock).toHaveBeenCalledWith({
      email: "staff@example.com",
      password: "secret",
    });
  });
});
