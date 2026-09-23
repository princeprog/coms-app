import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { randomBytes } from "node:crypto";

process.env.COMS_AUTH_GATEWAY_SECRET = randomBytes(32).toString("hex");

afterEach(() => {
  cleanup();
});
