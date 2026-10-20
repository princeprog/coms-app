"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, CheckCheck, FileText, LoaderCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DirectorySelect } from "@/components/shared/directory-select";
import {
  useNotificationCount,
  useNotifications,
  useReadNotification,
} from "../hooks/use-notifications";
import {
  notificationInboxHref,
  parseNotificationFilters,
} from "../notification-presentation";
import type { NotificationFilters } from "../schemas/notification.schema";
import { NotificationPagination } from "./notification-pagination";
import {
  NotificationEmpty,
  NotificationError,
  NotificationList,
  NotificationSkeleton,
} from "./notification-list";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function NotificationInbox({ userId }: { userId: string }) {
  // The persistent header can fill the shared cache before this streamed view hydrates.
  const hydrated = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot,
  );
  const params = useSearchParams();
  const router = useRouter();
  const filters = useMemo(() => parseNotificationFilters(params), [params]);
  const query = useNotifications(userId, filters);
  const count = useNotificationCount(userId, false);
  const read = useReadNotification(userId);
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / filters.page_size));
  const navigate = (changes: Partial<NotificationFilters>) =>
    router.replace(notificationInboxHref({ ...filters, ...changes }), {
      scroll: false,
    });
  useEffect(() => {
    if (query.isSuccess && filters.page > pages)
      router.replace(notificationInboxHref({ ...filters, page: pages }), {
        scroll: false,
      });
  }, [query.isSuccess, pages, filters, router]); // URL owns the query.
  return (
    <section
      className="mx-auto w-full max-w-5xl space-y-5"
      aria-label="Notification inbox"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">Notifications</h2>
        <Button
          variant="outline"
          disabled={
            !hydrated ||
            count.isError ||
            !count.data?.unread_count ||
            read.isPending
          }
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex gap-1 rounded-lg bg-muted p-1"
          aria-label="Notification status"
        >
          {(["all", "unread"] as const).map((status) => (
            <Button
              key={status}
              variant={filters.status === status ? "secondary" : "ghost"}
              className="min-w-20"
              aria-pressed={filters.status === status}
              onClick={() => navigate({ status, page: 1 })}
            >
              {status === "all" ? "All" : "Unread"}
              {status === "unread" &&
                hydrated &&
                !count.isError &&
                count.data !== undefined && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {count.data.unread_count}
                  </span>
                )}
            </Button>
          ))}
        </div>
        <DirectorySelect
          id="notification-type"
          label="Notification type"
          hideLabel
          alignItemWithTrigger={false}
          value={filters.type}
          className="w-52 [&_[data-slot=select-trigger]]:h-11"
          options={[
            {
              value: "all",
              label: "All types",
              icon: <Bell className="text-slate-500" />,
            },
            {
              value: "dispatches",
              label: "Dispatches",
              icon: <Truck className="text-blue-600" />,
            },
            {
              value: "reports",
              label: "Daily reports",
              icon: <FileText className="text-violet-600" />,
            },
          ]}
          onChange={(type) =>
            navigate({ type: type as NotificationFilters["type"], page: 1 })
          }
        />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex min-h-10 items-center justify-between border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          <span>Newest first</span>
          <span role="status">
            {hydrated && query.isFetching && !query.isPending
              ? "Refreshing…"
              : "Times in PHT"}
          </span>
        </div>
        <div aria-busy={query.isFetching}>
          {hydrated && query.isError ? (
            <NotificationError
              retry={() => {
                void query.refetch();
                void count.refetch();
              }}
            />
          ) : !hydrated || query.isPending ? (
            <NotificationSkeleton />
          ) : query.data?.items.length ? (
            <NotificationList items={query.data.items} />
          ) : (
            <NotificationEmpty
              unread={filters.status === "unread"}
              filtered={filters.type !== "all"}
            />
          )}
        </div>
        {hydrated && query.isSuccess && (
          <NotificationPagination
            filters={filters}
            total={total}
            navigate={navigate}
          />
        )}
      </div>
    </section>
  );
}
