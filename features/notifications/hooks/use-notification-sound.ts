"use client";
import { useEffect, useRef } from "react";
import { useNotificationCount } from "./use-notifications";
import { notificationSoundEnabled } from "./use-notification-sound-preference";
import {
  playNotificationChime,
  unlockNotificationAudio,
} from "../services/notification-sound";

export function useNotificationSound(userId: string) {
  const count = useNotificationCount(userId, false);
  const previous = useRef<{
    userId: string;
    count: number;
    latest: number;
  } | null>(null);
  useEffect(() => {
    const unlock = () => {
      if (notificationSoundEnabled(userId)) unlockNotificationAudio();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [userId]);
  useEffect(() => {
    if (!count.data || count.isError) return;
    const data = count.data;
    const latest = data.latest_unread_at
      ? Date.parse(data.latest_unread_at)
      : 0;
    const before = previous.current;
    previous.current = {
      userId,
      count: data.unread_count,
      latest: Math.max(latest, before?.userId === userId ? before.latest : 0),
    };
    // Initial loads and identity changes establish a silent baseline.
    if (!before || before.userId !== userId) return;
    const arrived =
      data.latest_unread_at === undefined
        ? data.unread_count > before.count // Compatible with an older API.
        : latest > before.latest;
    if (
      arrived &&
      data.unread_count > 0 &&
      !document.hidden &&
      document.hasFocus() &&
      notificationSoundEnabled(userId)
    ) {
      playNotificationChime();
    }
  }, [count.data, count.isError, userId]);
}
