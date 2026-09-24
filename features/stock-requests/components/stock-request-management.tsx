import { Badge } from "@/components/ui/badge";
import {
  OperationalEmptyState,
  OperationalPageIntro,
} from "@/components/shared/operational-page-ui";
import type { Branch } from "@/features/branches/types/branch.types";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import type {
  StockRequestCreateAction,
  StockRequestPage,
} from "@/features/stock-requests/types/stock-request.types";
import type { StockRequestPageFilters } from "@/features/stock-requests/services/stock-request-page-params";
import { StockRequestCreateDialog } from "./stock-request-create-dialog";
import { StockRequestFilter } from "./stock-request-filter";
import { StockRequestPagination } from "./stock-request-pagination";
import { StockRequestTable } from "./stock-request-table";

export function StockRequestManagement({
  page,
  filters,
  branchOptions = [],
  canCreate,
  formOptions,
  formOptionsIssue,
  createAction,
}: {
  page: StockRequestPage;
  filters: StockRequestPageFilters;
  branchOptions?: Branch[];
  canCreate: boolean;
  formOptions: {
    branches: Branch[];
    stockItems: StockItem[];
  } | null;
  formOptionsIssue: "permissions" | "forbidden" | "unavailable" | null;
  createAction: StockRequestCreateAction;
}) {
  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
  const canCreateWithOptions = Boolean(
    canCreate && formOptions?.branches.length && formOptions.stockItems.length,
  );
  const hasFilters = filters.status !== "all" || filters.branch_id !== "all";

  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6 p-4 md:p-6">
      <OperationalPageIntro
        description="Submit branch requests and review their approval history. Approved quantities affect inventory only after commissary dispatch."
        count={<Badge variant="secondary">{page.total} requests</Badge>}
        actions={
          canCreateWithOptions ? (
            <StockRequestCreateDialog
              branches={formOptions!.branches}
              stockItems={formOptions!.stockItems}
              selectedBranchId={
                filters.branch_id === "all" ? undefined : filters.branch_id
              }
              action={createAction}
            />
          ) : null
        }
      />
      {canCreate && !canCreateWithOptions && (
        <p
          role={formOptionsIssue ? "alert" : "status"}
          className="rounded-lg border bg-card p-4 text-sm"
        >
          {formOptionsIssue === "permissions"
            ? "Branch and stock-item read permissions are required to submit a request."
            : formOptionsIssue
              ? "Request options could not be loaded. Refresh this page to try again."
              : "Add an active branch and stock item before creating a request."}
        </p>
      )}
      <StockRequestFilter
        key={filters.status + ":" + filters.branch_id}
        filters={filters}
        branchOptions={branchOptions}
      />
      {page.items.length === 0 ? (
        <OperationalEmptyState
          title={
            hasFilters
              ? "No stock requests match these filters."
              : "No stock requests have been submitted yet."
          }
          description={
            hasFilters
              ? "Change the branch or status filter to see more requests."
              : "Submit a request when a branch needs commissary stock."
          }
        />
      ) : (
        <StockRequestTable page={page} />
      )}
      {pageCount > 1 && (
        <StockRequestPagination filters={filters} pageCount={pageCount} />
      )}
    </div>
  );
}
