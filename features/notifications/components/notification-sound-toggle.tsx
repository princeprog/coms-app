"use client";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationSoundPreference } from "../hooks/use-notification-sound-preference";
import { unlockNotificationAudio } from "../services/notification-sound";

export function NotificationSoundToggle({ userId }: { userId: string }) {
  const { enabled, setEnabled } = useNotificationSoundPreference(userId);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="justify-start"
      aria-label="Notification sound"
      aria-pressed={enabled}
      onClick={() => {
        setEnabled(!enabled);
        if (!enabled) {
          unlockNotificationAudio();
        }
      }}
    >
      {enabled ? (
        <Volume2 aria-hidden="true" />
      ) : (
        <VolumeX aria-hidden="true" />
      )}
      Sound {enabled ? "on" : "off"}
    </Button>
  );
}
