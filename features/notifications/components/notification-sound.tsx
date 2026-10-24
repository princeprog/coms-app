"use client";
import { useNotificationSound } from "../hooks/use-notification-sound";

// Separate from the route-keyed bell so navigation never resets the baseline.
export function NotificationSound({ userId }: { userId: string }) {
  useNotificationSound(userId);
  return null;
}
