"use client";
import Link from "next/link";
import {
  Bell,
  CircleCheck,
  FileCheck2,
  FileClock,
  FilePenLine,
  TriangleAlert,
  Truck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  notificationContext,
  notificationHref,
  notificationTimestamp,
  notificationTitle,
} from "../notification-presentation";
import type {
  Notification,
  NotificationKind,
} from "../schemas/notification.schema";

const appearance = {
  DISPATCH_COUNT_REMINDER: {
    icon: Bell,
    color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  DISPATCH_OVERDUE: {
    icon: TriangleAlert,
    color: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
  DISPATCH_LATE_COUNT: {
    icon: FileClock,
    color:
      "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
  DISPATCH_SENT: {
    icon: Truck,
    color: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  DISPATCH_DISCREPANCY: {
    icon: TriangleAlert,
    color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  DISPATCH_RESOLVED: {
    icon: CircleCheck,
    color:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  REPORT_SUBMITTED: {
    icon: FileClock,
    color: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  REPORT_RETURNED: {
    icon: FilePenLine,
    color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  REPORT_APPROVED: {
    icon: FileCheck2,
    color:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  SHIFT_NEEDS_REVIEW: {
    icon: Wallet,
    color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
} satisfies Record<NotificationKind, { icon: typeof Truck; color: string }>;

export function NotificationList({
  items,
  onOpen,
}: {
  items: Notification[];
  onOpen?: () => void;
}) {
  return (
    <ul className="divide-y" aria-label="Notifications">
      {items.map((item) => {
        const { icon: Icon, color } = appearance[item.kind];
        return (
          <li key={item.id}>
            <Link
              href={notificationHref(item)}
              onClick={onOpen}
              prefetch={false}
              className={cn(
                "flex gap-3 px-4 py-4 transition-colors hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:gap-4",
                !item.read_at && "bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  color,
                )}
                aria-hidden="true"
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "text-sm leading-5",
                      !item.read_at ? "font-semibold" : "font-medium",
                    )}
                  >
                    {notificationTitle[item.kind]}
                  </span>
                  {!item.read_at && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary">
                      <span className="sr-only">Unread</span>
                    </span>
                  )}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {item.branch_name}
                </span>
                <span className="block text-xs leading-5 text-muted-foreground">
                  {notificationContext(item)}
                </span>
                <time
                  dateTime={item.created_at}
                  className="block text-xs text-muted-foreground"
                >
                  {notificationTimestamp(item.created_at)}
                </time>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
export function NotificationSkeleton() {
  return (
    <div role="status" aria-label="Loading notifications" className="divide-y">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex gap-3 p-4">
          <Skeleton className="size-10 shrink-0 rounded-xl motion-reduce:animate-none" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-3/4 motion-reduce:animate-none" />
            <Skeleton className="h-3 w-1/2 motion-reduce:animate-none" />
            <Skeleton className="h-3 w-2/3 motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}
export function NotificationEmpty({
  unread = false,
  filtered = false,
}: {
  unread?: boolean;
  filtered?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
      <Bell className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium">
        {filtered
          ? "No notifications for this filter"
          : unread
            ? "You’re all caught up"
            : "No notifications yet"}
      </p>
    </div>
  );
}
export function NotificationError({ retry }: { retry: () => void }) {
  return (
    <div className="space-y-3 px-4 py-8 text-center">
      <p role="alert" className="text-sm text-muted-foreground">
        Could not load notifications.
      </p>
      <Button variant="outline" size="sm" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
