import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/features/auth/types/auth.types";
import { ApiRequestError } from "@/services/api-services";
import {
  loadSupplierReceiptDetailView,
  loadSupplierReceiptIndexView,
} from "./supplier-receipt-page-loader";

const {
  getSupplierReceiptDetail,
  getSupplierReceiptFormOptions,
  getSupplierReceiptPageData,
} = vi.hoisted(() => ({
  getSupplierReceiptDetail: vi.fn(),
  getSupplierReceiptFormOptions: vi.fn(),
  getSupplierReceiptPageData: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./supplier-receipt-queries", () => ({
  getSupplierReceiptDetail,
  getSupplierReceiptFormOptions,
  getSupplierReceiptPageData,
}));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const timestamp = "2026-09-24T01:30:00.000Z";
const pageData = { items: [], total: 0, page: 1, page_size: 25 };
const detail = {
  id,
  supplier_id: id,
  supplier_name: "North Farm Supply",
  received_at: "2026-09-24",
  status: "DRAFT" as const,
  idempotency_key: "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a",
  created_by_user_id: id,
  posted_by_user_id: null,
  posted_at: null,
  created_at: timestamp,
  updated_at: timestamp,
  total_cost: "33.125",
  items: [],
};
const options = {
  suppliers: [
    {
      id,
      supplier_name: "North Farm Supply",
      contact_person: null,
      contact_number: null,
      email: null,
      address: null,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
  ],
  stockItems: [
    {
      id,
      stock_item_name: "Flour",
      category: "Dry goods",
      unit: "kg",
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
  ],
};

function user(permissions: string[] = ["supplier_receipts.read"]): User {
  return {
    id,
    email: "manager@example.com",
    full_name: "Branch Manager",
    contact_number: "",
    role: {
      id,
      code: "RECEIVING_CLERK",
      name: "Receiving Clerk",
      isSystem: false,
      isActive: true,
    },
    permissions,
    branch_ids: [],
  };
}

describe("supplier receipt page loader", () => {
  beforeEach(() => {
    getSupplierReceiptDetail.mockReset().mockResolvedValue(detail);
    getSupplierReceiptFormOptions.mockReset().mockResolvedValue(options);
    getSupplierReceiptPageData.mockReset().mockResolvedValue(pageData);
  });

  it("denies the directory without supplier_receipts.read", async () => {
    await expect(loadSupplierReceiptIndexView(user([]), {})).resolves.toEqual({
      status: "forbidden",
    });
    expect(getSupplierReceiptPageData).not.toHaveBeenCalled();
  });

  it("does not load catalog options when the creator lacks catalog read grants", async () => {
    await expect(
      loadSupplierReceiptIndexView(
        user(["supplier_receipts.read", "supplier_receipts.create"]),
        {},
      ),
    ).resolves.toMatchObject({
      status: "ready",
      canCreate: true,
      formOptions: null,
      formOptionsIssue: "permissions",
    });
    expect(getSupplierReceiptFormOptions).not.toHaveBeenCalled();
  });

  it("loads active supplier and stock item options only with both read grants", async () => {
    await expect(
      loadSupplierReceiptIndexView(
        user([
          "supplier_receipts.read",
          "supplier_receipts.create",
          "suppliers.read",
          "stock_items.read",
        ]),
        {},
      ),
    ).resolves.toMatchObject({
      status: "ready",
      formOptions: options,
      canCreate: true,
      formOptionsIssue: null,
    });
    expect(getSupplierReceiptFormOptions).toHaveBeenCalledTimes(1);
  });

  it("preserves filters when redirecting an out-of-range page", async () => {
    getSupplierReceiptPageData.mockResolvedValue({
      items: [],
      total: 51,
      page: 10,
      page_size: 25,
    });

    await expect(
      loadSupplierReceiptIndexView(user(), {
        page: "10",
        search: "North Farm",
        status: "DRAFT",
      }),
    ).resolves.toEqual({
      status: "redirect",
      href: "/receipts?page=3&search=North+Farm&status=DRAFT",
    });
  });

  it("classifies list session and permission errors", async () => {
    getSupplierReceiptPageData.mockRejectedValueOnce(
      new ApiRequestError("Session expired.", 401),
    );
    await expect(loadSupplierReceiptIndexView(user(), {})).resolves.toEqual({
      status: "session-expired",
    });

    getSupplierReceiptPageData.mockRejectedValueOnce(
      new ApiRequestError("Receipt access denied.", 403),
    );
    await expect(loadSupplierReceiptIndexView(user(), {})).resolves.toEqual({
      status: "forbidden",
    });
  });

  it("keeps the receipt list available when optional form options are forbidden", async () => {
    getSupplierReceiptFormOptions.mockRejectedValue(
      new ApiRequestError("Catalog access denied.", 403),
    );

    await expect(
      loadSupplierReceiptIndexView(
        user([
          "supplier_receipts.read",
          "supplier_receipts.create",
          "suppliers.read",
          "stock_items.read",
        ]),
        {},
      ),
    ).resolves.toMatchObject({
      status: "ready",
      formOptions: null,
      formOptionsIssue: "forbidden",
    });
  });

  it("protects receipt detail reads and exposes posting only with its grant", async () => {
    await expect(loadSupplierReceiptDetailView(user([]), id)).resolves.toEqual({
      status: "forbidden",
    });
    expect(getSupplierReceiptDetail).not.toHaveBeenCalled();

    await expect(
      loadSupplierReceiptDetailView(user(), id),
    ).resolves.toMatchObject({
      status: "ready",
      receipt: detail,
      canPost: false,
    });
    await expect(
      loadSupplierReceiptDetailView(
        user(["supplier_receipts.read", "supplier_receipts.post"]),
        id,
      ),
    ).resolves.toMatchObject({ status: "ready", canPost: true });
  });

  it("treats a missing receipt as not found", async () => {
    getSupplierReceiptDetail.mockRejectedValue(
      new ApiRequestError("Supplier receipt not found.", 404),
    );

    await expect(
      loadSupplierReceiptDetailView(user(), "invalid-id"),
    ).resolves.toEqual({ status: "not-found" });
  });
});
