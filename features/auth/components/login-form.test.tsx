// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loginMock = vi.fn();
let pending = false;
let authError: Error | null = null;

vi.mock("@/features/auth/hooks/mutations/use-login", () => ({
  useLogin: () => ({
    mutate: loginMock,
    isPending: pending,
    error: authError,
  }),
}));

import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  beforeEach(() => {
    loginMock.mockReset();
    pending = false;
    authError = null;
  });

  it("shows validation errors and does not submit invalid credentials", () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("alert").textContent).toMatch(/valid email/i);
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("submits valid credentials", () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "staff@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(loginMock).toHaveBeenCalledWith({
      email: "staff@example.com",
      password: "secret",
    });
  });

  it("disables duplicate submission while the login request is pending", () => {
    pending = true;
    render(<LoginForm />);

    expect(
      (screen.getByRole("button", { name: /signing in/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("shows a generic invalid-credentials message for a 401", async () => {
    const { AuthApiError } =
      await import("@/features/auth/services/auth-client");
    authError = new AuthApiError("Invalid email or password", 401);
    render(<LoginForm />);

    expect(screen.getByRole("alert").textContent).toMatch(
      /email or password is incorrect/i,
    );
  });
});
