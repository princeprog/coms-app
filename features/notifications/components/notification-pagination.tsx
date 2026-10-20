"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DirectorySelect } from "@/components/shared/directory-select";
import type { NotificationFilters } from "../schemas/notification.schema";
export function NotificationPagination({
  filters,
  total,
  navigate,
}: {
  filters: NotificationFilters;
  total: number;
  navigate: (changes: Partial<NotificationFilters>) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / filters.page_size));
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t px-4 py-3">
      <p className="text-sm text-muted-foreground">
        {total
          ? `${(filters.page - 1) * filters.page_size + 1}–${Math.min(filters.page * filters.page_size, total)} of ${total}`
          : "0 notifications"}
      </p>
      <nav
        aria-label="Notification pages"
        className="flex flex-wrap items-center gap-3"
      >
        <span className="text-sm text-muted-foreground">Rows per page</span>
        <DirectorySelect
          id="notification-page-size"
          label="Rows per page"
          hideLabel
          alignItemWithTrigger={false}
          className="w-20 sm:w-20 [&_[data-slot=select-trigger]]:h-10"
          value={String(filters.page_size)}
          options={[10, 30, 50].map((size) => ({
            value: String(size),
            label: String(size),
          }))}
          onChange={(value) =>
            navigate({
              page_size: Number(value) as NotificationFilters["page_size"],
              page: 1,
            })
          }
        />
        <span className="text-sm tabular-nums">
          {filters.page} / {pages}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous page"
          disabled={filters.page <= 1}
          onClick={() => navigate({ page: filters.page - 1 })}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next page"
          disabled={filters.page >= pages}
          onClick={() => navigate({ page: filters.page + 1 })}
        >
          <ChevronRight />
        </Button>
      </nav>
    </div>
  );
}
