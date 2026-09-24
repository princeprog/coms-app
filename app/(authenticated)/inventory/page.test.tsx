import { beforeEach, describe, expect, it, vi } from "vitest";
import InventoryPage from "./page";

const { getCurrentUserFromServer, loadInventoryView, redirect, notFound } =
  vi.hoisted(() => ({
    getCurrentUserFromServer: vi.fn(),
    loadInventoryView: vi.fn(),
    redirect: vi.fn((path: string): never => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    }),
    notFound: vi.fn((): never => {
      throw new Error("NEXT_NOT_FOUND");
    }),
  }));

vi.mock("next/navigation", () => ({ redirect, notFound }));
vi.mock("@/features/auth/services/auth-server", () => ({
  getCurrentUserFromServer,
}));
vi.mock("@/features/inventory/services/inventory-page-loader", () => ({
  loadInventoryView,
}));
vi.mock("@/features/inventory/services/inventory-actions", () => ({
  adjustInventoryAction: vi.fn(),
}));
vi.mock("@/components/layout/app-page-shell", () => ({
  AppPageShell: () => null,
}));
vi.mock("@/features/auth/components/auth-service-error", () => ({
  AuthServiceError: () => null,
}));
vi.mock("@/features/auth/components/session-recovery", () => ({
  SessionRecovery: () => null,
}));
vi.mock("@/features/catalogs/components/catalog-load-error", () => ({
  CatalogLoadError: () => null,
}));
vi.mock("@/features/inventory/components/inventory-management", () => ({
  InventoryManagement: () => null,
}));

const sessionUser = {
  id: "9b445ee0-532f-4a31-93db-25d01c5f527f",
  email: "manager@example.com",
  full_name: "Branch Manager",
  contact_number: "",
};

describe("InventoryPage session handling", () => {
  beforeEach(() => {
    getCurrentUserFromServer.mockReset();
    loadInventoryView.mockReset();
  });

  it("redirects unauthenticated users before loading inventory", async () => {
    getCurrentUserFromServer.mockResolvedValue({ status: "unauthenticated" });

    await expect(
      InventoryPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT:/");
    expect(loadInventoryView).not.toHaveBeenCalled();
  });

  it("turns a forbidden inventory result into a not-found response", async () => {
    getCurrentUserFromServer.mockResolvedValue({
      status: "authenticated",
      user: sessionUser,
    });
    loadInventoryView.mockResolvedValue({ status: "forbidden" });

    await expect(
      InventoryPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(loadInventoryView).toHaveBeenCalledWith(sessionUser, {});
  });

  it("forwards canonical pagination redirects", async () => {
    getCurrentUserFromServer.mockResolvedValue({
      status: "authenticated",
      user: sessionUser,
    });
    loadInventoryView.mockResolvedValue({
      status: "redirect",
      href: "/inventory?scope=COMMISSARY&page=3",
    });

    await expect(
      InventoryPage({ searchParams: Promise.resolve({ page: "10" }) }),
    ).rejects.toThrow("NEXT_REDIRECT:/inventory?scope=COMMISSARY&page=3");
    expect(loadInventoryView).toHaveBeenCalledWith(sessionUser, { page: "10" });
  });
});
