"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { ApiRequestError } from "@/services/api-services";
import { notificationKeys } from "../query-keys";
import {
  getNotificationCountAction,
  getNotificationsAction,
  markNotificationReadAction,
} from "../services/notification-actions";
import type {
  NotificationFilters,
  NotificationResult,
} from "../schemas/notification.schema";

async function unwrap<T>(request: Promise<NotificationResult<T>>) {
  const result = await request;
  if (!result.ok) throw new ApiRequestError(result.error, result.status);
  return result.data;
}
const refreshOptions = {
  refetchInterval: 30_000,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: "always" as const,
  refetchOnReconnect: "always" as const,
  staleTime: 10_000,
  retry: (count: number, error: Error) =>
    count < 1 &&
    !(
      error instanceof ApiRequestError && [401, 403, 404].includes(error.status)
    ),
};
export function useNotificationCount(userId: string, poll = true) {
  return useQuery({
    ...refreshOptions,
    queryKey: notificationKeys.count(userId),
    refetchInterval: poll ? 30_000 : false,
    queryFn: () => unwrap(getNotificationCountAction(userId)),
  });
}
export function useNotifications(
  userId: string,
  filters: NotificationFilters,
  enabled = true,
) {
  return useQuery({
    ...refreshOptions,
    queryKey: notificationKeys.list(userId, filters),
    enabled,
    refetchOnMount: "always",
    queryFn: () => unwrap(getNotificationsAction(userId, filters)),
  });
}
export function useReadNotification(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string | undefined) =>
      unwrap(markNotificationReadAction(userId, id)),
    onMutate: () =>
      client.cancelQueries({ queryKey: notificationKeys.user(userId) }),
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: notificationKeys.user(userId),
      });
    },
    onError: () => {
      toast.add({
        type: "error",
        title: "Could not mark notifications as read. Please try again.",
      });
    },
  });
}
