"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DirectorySelect } from "@/components/shared/directory-select";
import type { useShiftDirectory } from "../hooks/use-shift-directory";

export function ShiftPagination({
  directory,
}: {
  directory: ReturnType<typeof useShiftDirectory>;
}) {
  const { query, update, result, loading } = directory;
  const total = result.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / query.page_size));
  const start = total ? (query.page - 1) * query.page_size + 1 : 0;
  const end = Math.min(query.page * query.page_size, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-5 py-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {loading
          ? "Loading shifts…"
          : `Showing ${start}–${end} of ${total} ${total === 1 ? "shift" : "shifts"}`}
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>
          <DirectorySelect
            id="shift-page-size"
            label="Rows per page"
            hideLabel
            alignItemWithTrigger={false}
            className="w-20 sm:w-20 [&_[data-slot=select-trigger]]:h-10"
            value={String(query.page_size)}
            options={[10, 30, 50].map((size) => ({
              value: String(size),
              label: String(size),
            }))}
            onChange={(value) =>
              update({ page_size: Number(value) as 10 | 30 | 50 })
            }
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={loading || query.page <= 1}
            onClick={() => update({ page: query.page - 1 }, false)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="px-2 text-sm tabular-nums">
            {query.page} of {pages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={loading || query.page >= pages}
            onClick={() => update({ page: query.page + 1 }, false)}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
