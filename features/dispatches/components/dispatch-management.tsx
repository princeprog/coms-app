import {
  OperationalEmptyState,
  OperationalPageIntro,
} from "@/components/shared/operational-page-ui";
import { Badge } from "@/components/ui/badge";
import type { DispatchPage } from "@/features/dispatches/types/dispatch.types";
import type { DispatchPageFilters } from "@/features/dispatches/services/dispatch-page-params";
import { DispatchFilter } from "./dispatch-filter";
import { DispatchPagination } from "./dispatch-pagination";
import { DispatchTable } from "./dispatch-table";
import { DispatchCreateDialog } from "./dispatch-create-dialog";
import type {
  DispatchCreateAction,
  DispatchCreateOptions,
} from "@/features/dispatches/types/dispatch.types";

export function DispatchManagement({
  page,
  filters,
  canCreate,
  createOptions,
  createOptionsIssue,
  createAction,
}: {
  page: DispatchPage;
  filters: DispatchPageFilters;
  canCreate: boolean;
  createOptions: DispatchCreateOptions | null;
  createOptionsIssue: "permissions" | "forbidden" | "unavailable" | null;
  createAction: DispatchCreateAction;
}) {
  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
  const hasFilters =
    filters.status !== "all" || filters.discrepancyStatus !== "all";

  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6 p-4 md:p-6">
      <OperationalPageIntro
        description="Create commissary dispatches and track branch receipts, discrepancies, and quantities still in transit."
        count={<Badge variant="secondary">{page.total} dispatches</Badge>}
        actions={
          <DispatchCreateDialog
            canCreate={canCreate}
            options={createOptions}
            optionsIssue={createOptionsIssue}
            action={createAction}
          />
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
              : "Create a dispatch draft by choosing a branch, stock items, and quantities. Posting the draft deducts commissary inventory."
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
