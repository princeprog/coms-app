import "server-only";

import { cookies } from "next/headers";
import { stockItemsEndpoint } from "@/features/stock-items/constants";
import { stockItemPageSchema } from "@/features/stock-items/schemas/stock-item.schema";
import { suppliersEndpoint } from "@/features/suppliers/constants";
import { supplierPageSchema } from "@/features/suppliers/schemas/supplier.schema";
import { supplierReceiptsEndpoint } from "@/features/supplier-receipts/constants";
import {
  supplierReceiptDetailSchema,
  supplierReceiptPageSchema,
} from "@/features/supplier-receipts/schemas/supplier-receipt.schema";
import type {
  SupplierReceiptFormOptions,
  SupplierReceiptPage,
} from "@/features/supplier-receipts/types/supplier-receipt.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

const catalogPageSize = 100;

type CatalogPageData<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

type CatalogPageParser<T> = {
  safeParse: (
    value: unknown,
  ) =>
    | { success: true; data: CatalogPageData<T> }
    | { success: false; error: unknown };
};

export async function getSupplierReceiptPageData({
  page,
  search,
  status,
}: {
  page: number;
  search: string;
  status?: "DRAFT" | "POSTED";
}): Promise<SupplierReceiptPage> {
  const params = new URLSearchParams({ page: String(page), page_size: "25" });
  if (search.trim()) params.set("search", search.trim());
  if (status) params.set("status", status);
  const payload = await requestComsApi<unknown>(
    `${supplierReceiptsEndpoint}?${params}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = supplierReceiptPageSchema.safeParse(payload);
  if (!parsed.success)
    throw new ApiRequestError("Invalid supplier receipt response.", 502);
  return parsed.data;
}

export async function getSupplierReceiptDetail(id: string) {
  if (!zUuid(id)) throw new ApiRequestError("Supplier receipt not found.", 404);
  const payload = await requestComsApi<unknown>(
    `${supplierReceiptsEndpoint}/${id}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = supplierReceiptDetailSchema.safeParse(payload);
  if (!parsed.success)
    throw new ApiRequestError("Invalid supplier receipt detail.", 502);
  return parsed.data;
}

export async function getSupplierReceiptFormOptions(): Promise<SupplierReceiptFormOptions> {
  const cookieHeader = (await cookies()).toString();
  const [suppliers, stockItems] = await Promise.all([
    getActiveCatalogPages(suppliersEndpoint, supplierPageSchema, cookieHeader),
    getActiveCatalogPages(
      stockItemsEndpoint,
      stockItemPageSchema,
      cookieHeader,
    ),
  ]);
  return { suppliers, stockItems };
}

async function getActiveCatalogPages<T>(
  endpoint: string,
  schema: CatalogPageParser<T>,
  cookieHeader: string,
): Promise<T[]> {
  const getPage = async (page: number) => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(catalogPageSize),
      is_active: "true",
    });
    const payload = await requestComsApi<unknown>(`${endpoint}?${params}`, {
      cookieHeader,
    });
    const parsed = schema.safeParse(payload);
    if (!parsed.success || parsed.data.page !== page) {
      throw new ApiRequestError(
        "Invalid receipt catalog options response.",
        502,
      );
    }
    return parsed.data;
  };
  const firstPage = await getPage(1);
  const pageCount = Math.ceil(firstPage.total / firstPage.page_size);
  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => getPage(index + 2)),
  );
  if (
    remainingPages.some(
      (page) =>
        page.total !== firstPage.total ||
        page.page_size !== firstPage.page_size,
    )
  ) {
    throw new ApiRequestError(
      "Receipt catalog options changed while loading.",
      502,
    );
  }
  return [firstPage, ...remainingPages].flatMap((page) => page.items);
}

function zUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
