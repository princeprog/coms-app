import "server-only";
import { cookies } from "next/headers";
import { requestComsApi } from "@/services/server-api-services";
import { ApiRequestError } from "@/services/api-services";
import { paymentMethodsEndpoint } from "../constants";
import { paymentMethodPageSchema } from "../schemas/payment-method.schema";
export async function getPaymentMethodPageData({
  page,
  search,
  active,
}: {
  page: number;
  search: string;
  active?: boolean;
}) {
  const params = new URLSearchParams({ page: String(page), page_size: "25" });
  if (search) params.set("search", search);
  if (active !== undefined) params.set("is_active", String(active));
  const result = await requestComsApi<unknown>(
    `${paymentMethodsEndpoint}?${params}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = paymentMethodPageSchema.safeParse(result);
  if (!parsed.success)
    throw new ApiRequestError("Unable to read payment methods.", 502);
  return {
    ...parsed.data,
    items: parsed.data.items.map((item) => ({
      ...item,
      status: item.is_active ? "enabled" : "disabled",
    })),
  };
}
