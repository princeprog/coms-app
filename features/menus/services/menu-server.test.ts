import { expect, it, vi } from "vitest";
import { ApiRequestError } from "@/services/api-services";
import { menuAccess, menuError } from "./menu-server";

vi.mock("server-only", () => ({}));
vi.mock("@/features/auth/services/auth-server", () => ({
  getCurrentUserFromServer: vi
    .fn()
    .mockResolvedValue({ status: "unavailable" }),
}));

it("keeps a service outage retryable instead of treating it as an expired session", async () => {
  const error = await menuAccess("products.create").catch(
    (error: unknown) => error,
  );
  expect(error).toBeInstanceOf(ApiRequestError);
  expect((error as ApiRequestError).status).toBe(503);
  expect(menuError(error)).toMatch(/try again/);
});
