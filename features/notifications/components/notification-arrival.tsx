"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useReadNotification } from "../hooks/use-notifications";

// Reading on arrival allows the existing unsaved-navigation guard to cancel a link.
export function NotificationArrival({ userId }: { userId: string }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const handled = useRef<string | null>(null);
  const { mutateAsync } = useReadNotification(userId);
  const id = params.get("notification_id");
  useEffect(() => {
    if (!id) {
      handled.current = null;
      return;
    }
    if (!id || handled.current === id) return;
    handled.current = id;
    void mutateAsync(id)
      .catch(() => undefined)
      .finally(() => {
        const current = new URL(window.location.href);
        if (
          current.pathname !== pathname ||
          current.searchParams.get("notification_id") !== id
        )
          return;
        current.searchParams.delete("notification_id");
        router.replace(
          `${current.pathname}${current.searchParams.size ? `?${current.searchParams}` : ""}${current.hash}`,
          { scroll: false },
        );
      });
  }, [id, mutateAsync, params, pathname, router]);
  return null;
}
