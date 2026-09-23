import { describe, expect, it } from "vitest";

import { authMeResponseSchema, loginSchema } from "./auth.schema";
import { authTestMeResponse, authTestSessionUser } from "@/test/auth-fixtures";

describe("loginSchema", () => {
  it("requires a valid email and password", () => {
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(
      false,
    );
    expect(
      loginSchema.safeParse({ email: "staff@example.com", password: "secret" })
        .success,
    ).toBe(true);
  });
});

describe("authMeResponseSchema", () => {
  it("maps role, grants, and branch assignments into the safe current user", () => {
    const payload = {
      ...authTestMeResponse,
      user: { ...authTestMeResponse.user, hashed_password: "never expose" },
    };
    expect(authMeResponseSchema.parse(payload).user).toEqual(
      authTestSessionUser,
    );
  });

  it("rejects malformed permission context", () => {
    expect(
      authMeResponseSchema.safeParse({
        ...authTestMeResponse,
        branch_ids: ["not-a-uuid"],
      }).success,
    ).toBe(false);
  });
});
