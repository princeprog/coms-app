import { describe, expect, it } from "vitest";

import { loginSchema } from "./auth.schema";

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
