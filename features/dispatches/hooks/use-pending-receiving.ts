"use client";
import { useQuery } from "@tanstack/react-query";
import { getPendingReceivingAction } from "../services/pending-receiving-actions";
export function usePendingReceiving(
  userId: string,
  filters: {
    page: number;
    pageSize: number;
    receivingStatus: string;
    branchId?: string;
  },
) {
  return useQuery({
    queryKey: ["pending-receiving", userId, filters],
    queryFn: async () => {
      const result = await getPendingReceivingAction(userId, filters);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
    retry: 1,
  });
}
