"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import {
  deviceListSchema,
  sessionPageSchema,
  transactionPageSchema,
} from "../schemas/offline-admin.schema";
import { offlineBranchPath, offlineRequest } from "./offline-api";
import { offlineErrorMessage } from "./offline-errors";

export function useRegisterDevices(branchId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["pos-offline", branchId, "devices"],
    enabled,
    retry: false,
    queryFn: async () =>
      deviceListSchema.parse(
        await offlineRequest(`${offlineBranchPath(branchId)}/devices`),
      ),
  });
}
export function useRegisterSessions(
  branchId: string,
  page: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["pos-offline", branchId, "sessions", page],
    enabled,
    retry: false,
    queryFn: async () =>
      sessionPageSchema.parse(
        await offlineRequest(
          `${offlineBranchPath(branchId)}/sessions?page=${page}&page_size=25`,
        ),
      ),
  });
}
export function useHeldTransactions(
  branchId: string,
  sessionId: string,
  page: number,
) {
  return useQuery({
    queryKey: ["pos-offline", branchId, "transactions", sessionId, page],
    retry: false,
    queryFn: async () =>
      transactionPageSchema.parse(
        await offlineRequest(
          `${offlineBranchPath(branchId)}/sessions/${sessionId}/transactions?page=${page}&page_size=25`,
        ),
      ),
  });
}
export function useOfflineAdminMutation(branchId: string) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (input: { path: string; method?: string; body: unknown }) =>
      offlineRequest(
        `${offlineBranchPath(branchId)}${input.path}`,
        input.method ?? "POST",
        input.body,
      ),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["pos-offline", branchId] });
      toast.add({ type: "success", title: "Register updated" });
    },
    onError: (error) =>
      toast.add({
        type: "error",
        title: "Unable to update register",
        description: offlineErrorMessage(error),
      }),
  });
}
