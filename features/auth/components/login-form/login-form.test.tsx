// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loginMock = vi.fn();
let pending = false;
let succeeded = false;
let authError: Error | null = null;

vi.mock("@/features/auth/hooks/mutations/use-login", () => ({
  useLogin: () => ({
    mutate: loginMock,
    isPending: pending,
    isSuccess: succeeded,
    error: authError,
  }),
}));

import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  beforeEach(() => {
    loginMock.mockReset();
    pending = false;
    succeeded = false;
    authError = null;
  });

  it("shows each validation error beside its field and focuses the first", () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Password");
    expect(email.getAttribute("aria-invalid")).toBe("true");
    expect(password.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText(/valid email/i).id).toBe(
      email.getAttribute("aria-describedby"),
    );
    expect(screen.getByText(/enter your password/i)).toBeTruthy();
    expect(document.activeElement).toBe(email);
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("clears only the field the user corrects", () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "staff@example.com" },
    });

    expect(screen.queryByText(/valid email/i)).toBeNull();
    expect(screen.getByText(/enter your password/i)).toBeTruthy();
  });

  it("submits valid credentials", () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "staff@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(loginMock).toHaveBeenCalledWith(
      { email: "staff@example.com", password: "secret" },
      expect.any(Object),
    );
  });

  it("disables duplicate submission while the login request is pending", () => {
    pending = true;
    render(<LoginForm />);

    expect(
      (screen.getByRole("button", { name: /signing in/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("stays busy after a successful sign-in until the redirect lands", () => {
    succeeded = true;
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
