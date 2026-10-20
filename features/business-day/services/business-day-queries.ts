import "server-only";

import { cookies } from "next/headers";
import { getTodayManilaDate } from "@/features/daily-reports/services/manila-date";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import { businessDayEndpoint } from "../constants";
import {
  businessDaySchema,
  type BusinessDay,
} from "../schemas/business-day.schema";

export async function getBusinessDay(): Promise<BusinessDay> {
  const payload = await requestComsApi<unknown>(businessDayEndpoint, {
    cookieHeader: (await cookies()).toString(),
  });
  const parsed = businessDaySchema.safeParse(payload);
  if (!parsed.success)
    throw new ApiRequestError("Unable to read the business day.", 502);
  return parsed.data;
}

/** Today's business date, falling back to the Manila calendar date if settings are unavailable. */
export async function getBusinessToday() {
  try {
    return (await getBusinessDay()).business_today;
  } catch {
    return getTodayManilaDate();
  }
}
