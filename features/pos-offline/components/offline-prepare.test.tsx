// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OfflineRegister } from "../hooks/use-offline-register";
import { OfflinePrepare } from "./offline-prepare";
vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));

const branch = "00000000-0000-4000-8000-000000000001";
const device = "00000000-0000-4000-8000-000000000002";
const register = {
  online: true,
  pending: false,
  error: "",
  deviceId: async () => device,
  prepare: vi.fn(),
  register: vi.fn(),
} as unknown as OfflineRegister;

function renderWith(response: Response) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <OfflinePrepare branchId={branch} register={register} />
    </QueryClientProvider>,
  );
}
afterEach(() => vi.unstubAllGlobals());

describe("offline register preparation", () => {
  it("shows a pending browser without offering preparation", async () => {
    renderWith(
      Response.json({ id: device, name: "Front counter", status: "PENDING" }),
    );
    expect(await screen.findByText("Waiting for approval")).toBeTruthy();
    expect(screen.getByText("Front counter")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Prepare offline POS" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Register this browser" }),
    ).toBeNull();
  });
  it("offers preparation once a manager approves the browser", async () => {
    renderWith(
      Response.json({ id: device, name: "Front counter", status: "APPROVED" }),
    );
    const prepare = await screen.findByRole("button", {
      name: "Prepare offline POS",
    });
    expect((prepare as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText("Approved")).toBeTruthy();
  });
  it("asks an unregistered browser to request approval", async () => {
    renderWith(
      Response.json({ message: "Register device not found" }, { status: 404 }),
    );
    expect(
      await screen.findByRole("button", { name: "Register this browser" }),
    ).toBeTruthy();
    expect(screen.getByText("Not registered")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Prepare offline POS" }),
    ).toBeNull();
  });
});
