"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { hasPermission } from "@/features/auth/permissions";
import { requestComsApi } from "@/services/server-api-services";
import { restockSuggestionsEndpoint } from "../constants";
import {
  restockSuggestionsSchema,
  type RestockSuggestion,
} from "../schemas/restock-suggestion.schema";

/** Items at or below their reorder level at a branch, with quantities to send. */
export async function getRestockSuggestions(
  branchId: string,
): Promise<RestockSuggestion[]> {
  const id = z.uuid().parse(branchId);
  const session = await getCurrentUserFromServer();
  if (
    session.status !== "authenticated" ||
    !hasPermission(session.user, "dispatches.create")
  )
    throw new Error("You cannot prepare dispatches.");
  const payload = await requestComsApi<unknown>(
    `${restockSuggestionsEndpoint}?${new URLSearchParams({ branch_id: id })}`,
    { cookieHeader: (await cookies()).toString() },
  );
  const parsed = restockSuggestionsSchema.safeParse(payload);
  if (!parsed.success || parsed.data.branch_id !== id)
    throw new Error("Restock suggestions could not be loaded.");
  return parsed.data.items;
}
