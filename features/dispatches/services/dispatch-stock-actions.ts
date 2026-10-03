"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { hasPermission } from "@/features/auth/permissions";
import { inventoryEndpoints } from "@/features/inventory/constants";
import { inventoryPageSchema } from "@/features/inventory/schemas/inventory.schema";
import { stockItemsEndpoint } from "@/features/stock-items/constants";
import { stockItemPageSchema } from "@/features/stock-items/schemas/stock-item.schema";
import { requestComsApi } from "@/services/server-api-services";
import type { DispatchStockPage } from "../types/dispatch.types";

export async function searchDispatchStock(input: {
  search: string;
  page: number;
}): Promise<DispatchStockPage> {
  const query = z
    .object({ search: z.string().max(100), page: z.number().int().positive() })
    .parse(input);
  const session = await getCurrentUserFromServer();
  if (
    session.status !== "authenticated" ||
    !hasPermission(session.user, "dispatches.create") ||
    !hasPermission(session.user, "dispatches.dispatch")
  )
    throw new Error(
      "You need dispatch creation and sending permissions. Sign in again if your access changed.",
    );
  const availabilityVisible = hasPermission(
    session.user,
    "inventory.commissary_read",
  );
  if (!availabilityVisible && !hasPermission(session.user, "stock_items.read"))
    throw new Error("Your role cannot view stock items.");
  const params = new URLSearchParams({
    search: query.search,
    page: String(query.page),
    page_size: "25",
  });
  if (!availabilityVisible) params.set("is_active", "true");
  const endpoint = availabilityVisible
    ? inventoryEndpoints.commissary
    : stockItemsEndpoint;
  const payload = await requestComsApi<unknown>(`${endpoint}?${params}`, {
    cookieHeader: (await cookies()).toString(),
  });
  const parsed = availabilityVisible
    ? inventoryPageSchema.safeParse(payload)
    : stockItemPageSchema.safeParse(payload);
  if (
    !parsed.success ||
    parsed.data.page !== query.page ||
    parsed.data.page_size !== 25
  )
    throw new Error("Stock options could not be loaded. Try again.");
  return {
    ...parsed.data,
    availabilityVisible,
    items: parsed.data.items.map((item) => ({
      id: item.id,
      is_active: item.is_active,
      stock_item_name: item.stock_item_name,
      unit: item.unit,
      quantity_on_hand:
        "quantity_on_hand" in item ? String(item.quantity_on_hand) : null,
    })),
  };
}
