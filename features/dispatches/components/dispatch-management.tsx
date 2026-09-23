import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  dispatchStatuses,
  dispatchesRoute,
} from "@/features/dispatches/constants";
import type { DispatchPage } from "@/features/dispatches/types/dispatch.types";
import type { DispatchPageFilters } from "@/features/dispatches/services/dispatch-page-params";
import { DispatchPagination } from "./dispatch-pagination";
import { DispatchTable } from "./dispatch-table";

export function DispatchManagement({
  page,
  filters,
  canCreate,
}: {
  page: DispatchPage;
  filters: DispatchPageFilters;
  canCreate: boolean;
}) {
  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
  const hasFilters = filters.status !== "all";

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Track commissary dispatches, partial branch receipts, and quantities
          still in transit.
        </p>
        {canCreate && (
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/replenishment?status=APPROVED"
          >
            Review approved requests
          </Link>
        )}
      </section>
      <form
        action={dispatchesRoute}
        method="get"
        aria-label="Filter dispatches"
        className="grid gap-3 rounded-4xl border bg-card p-4 sm:grid-cols-[minmax(12rem,1fr)_auto] sm:items-end"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="dispatch-status" className="text-sm font-medium">
            Dispatch status
          </label>
          <select
            id="dispatch-status"
            name="status"
            defaultValue={filters.status}
            className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <option value="all">All statuses</option>
            {dispatchStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline">
          Apply filters
        </Button>
      </form>
      {page.items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">
              {hasFilters
                ? "No dispatches match this status."
                : "No dispatches have been created yet."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasFilters
                ? "Choose another status to review dispatches."
                : "Open an approved stock request to prepare its dispatch."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <DispatchTable page={page} />
      )}
      {pageCount > 1 && (
        <DispatchPagination filters={filters} pageCount={pageCount} />
      )}
    </div>
  );
}
