import type { NotificationFilters } from "./schemas/notification.schema";
export const notificationKeys = {
  user: (userId: string) => ["notifications", userId] as const,
  count: (userId: string) =>
    [...notificationKeys.user(userId), "count"] as const,
  list: (userId: string, filters: NotificationFilters) =>
    [...notificationKeys.user(userId), "list", filters] as const,
};
