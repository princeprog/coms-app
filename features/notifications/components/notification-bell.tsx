"use client";
import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, CircleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationSoundToggle } from "./notification-sound-toggle";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useNotificationCount,
  useNotifications,
  useReadNotification,
} from "../hooks/use-notifications";
import {
  NotificationEmpty,
  NotificationError,
  NotificationList,
  NotificationSkeleton,
} from "./notification-list";

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const count = useNotificationCount(userId);
  const list = useNotifications(
    userId,
    { status: "all", type: "all", page: 1, page_size: 10 },
    open,
  );
  const read = useReadNotification(userId);
  const unread = count.isError ? undefined : count.data?.unread_count;
  const label =
    unread === undefined
      ? count.isError
        ? "Notifications, count unavailable"
        : "Notifications, loading"
      : `Notifications, ${unread} unread`;
  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) void count.refetch();
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative size-10 rounded-full"
            aria-label={label}
            aria-busy={count.isPending}
          />
        }
      >
        <Bell className="size-5" />
        {unread !== undefined && unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
        {count.isError && (
          <CircleAlert
            className="absolute top-0 right-0 size-3 text-amber-600"
            aria-hidden="true"
          />
        )}
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={10}
        positionMethod="fixed"
        className="max-h-(--available-height) w-96 max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 motion-reduce:animate-none"
        data-coms-ui="operational"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
          <PopoverTitle className="text-base">Notifications</PopoverTitle>
          <Button
            variant="ghost"
            size="sm"
            disabled={!unread || read.isPending}
            onClick={() => read.mutate(undefined)}
          >
            {read.isPending ? (
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
            ) : (
              <CheckCheck className="size-4" />
            )}
            Mark all as read
          </Button>
        </div>
        <div
          className="min-h-0 max-h-[min(32rem,65dvh)] overflow-y-auto overscroll-contain"
          aria-busy={list.isFetching}
        >
          {list.isError ? (
            <NotificationError
              retry={() => {
                void list.refetch();
                void count.refetch();
              }}
            />
          ) : list.isPending ? (
            <NotificationSkeleton />
          ) : list.data.items.length ? (
            <NotificationList
              items={list.data.items}
              onOpen={() => setOpen(false)}
            />
          ) : (
            <NotificationEmpty />
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-3 py-2">
          <NotificationSoundToggle userId={userId} />
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
