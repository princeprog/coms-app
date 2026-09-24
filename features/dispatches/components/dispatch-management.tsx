import Link from "next/link";
import {
  OperationalEmptyState,
  OperationalPageIntro,
} from "@/components/shared/operational-page-ui";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { DispatchPage } from "@/features/dispatches/types/dispatch.types";
import type { DispatchPageFilters } from "@/features/dispatches/services/dispatch-page-params";
import { DispatchFilter } from "./dispatch-filter";
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
    <div data-coms-ui="operational" className="flex flex-col gap-6 p-4 md:p-6">
      <OperationalPageIntro
        description="Track commissary dispatches, partial branch receipts, and quantities still in transit."
        count={<Badge variant="secondary">{page.total} dispatches</Badge>}
        actions={
          canCreate && (
            <Link
              className={buttonVariants({ variant: "default", size: "sm" })}
              href="/replenishment?status=APPROVED"
              aria-label="Review approved requests"
            >
              Review requests
            </Link>
          )
        }
      />
      <DispatchFilter key={filters.status} filters={filters} />
      {page.items.length === 0 ? (
        <OperationalEmptyState
          title={
            hasFilters
              ? "No dispatches match this status."
              : "No dispatches have been created yet."
          }
          description={
            hasFilters
              ? "Choose another status to review dispatches."
              : "Open an approved stock request to prepare its dispatch."
          }
        />
      ) : (
        <DispatchTable page={page} />
      )}
      {pageCount > 1 && (
        <DispatchPagination filters={filters} pageCount={pageCount} />
      )}
    </div>
  );
}
