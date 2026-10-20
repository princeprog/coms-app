"use server";
import { z } from "zod";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { getDispatchPageData } from "./dispatch-queries";
export async function getPendingReceivingAction(
  userId: string,
  input: unknown,
) {
  const session = await getCurrentUserFromServer();
  if (session.status !== "authenticated" || session.user.id !== userId)
    return {
      ok: false as const,
      error: "Your session changed. Refresh this page.",
    };
  const parsed = z
    .object({
      page: z.number().int().min(1),
      pageSize: z.union([z.literal(10), z.literal(30), z.literal(50)]),
      receivingStatus: z.enum([
        "pending",
        "AWAITING_COUNT",
        "OVERDUE",
        "REVIEW",
      ]),
      branchId: z.uuid().optional(),
    })
    .safeParse(input);
  if (!parsed.success)
    return { ok: false as const, error: "Check the receiving filters." };
  try {
    return {
      ok: true as const,
      data: await getDispatchPageData({
        ...parsed.data,
        status: "all",
        discrepancyStatus: "all",
      }),
    };
  } catch {
    return {
      ok: false as const,
      error: "Pending deliveries could not be loaded. Try again.",
    };
  }
}
