import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Branch } from "@/features/branches/types/branch.types";
import type { StockRequestCreateAction } from "@/features/stock-requests/types/stock-request.types";
import type { StockRequestPage } from "@/features/stock-requests/types/stock-request.types";
import {
  stockRequestStatuses,
  stockRequestsRoute,
} from "@/features/stock-requests/constants";
import type { StockRequestPageFilters } from "@/features/stock-requests/services/stock-request-page-params";
import { StockRequestCreateDialog } from "./stock-request-create-dialog";
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
    stockItems: import("@/features/stock-items/types/stock-item.types").StockItem[];
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
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Submit branch requests and review their approval history. Approved
          quantities affect inventory only after commissary dispatch.
        </p>
        {canCreateWithOptions && (
          <StockRequestCreateDialog
            branches={formOptions!.branches}
            stockItems={formOptions!.stockItems}
            selectedBranchId={
              filters.branch_id === "all" ? undefined : filters.branch_id
            }
            action={createAction}
          />
        )}
      </section>
      {canCreate && !canCreateWithOptions && (
        <Card>
          <CardContent className="py-5">
            <p role={formOptionsIssue ? "alert" : "status"} className="text-sm">
              {formOptionsIssue === "permissions"
                ? "Branch and stock-item read permissions are required to submit a request."
                : formOptionsIssue
                  ? "Request options could not be loaded. Refresh this page to try again."
                  : "Add an active branch and stock item before creating a request."}
            </p>
          </CardContent>
        </Card>
      )}
      <form
        action={stockRequestsRoute}
        method="get"
        aria-label="Filter stock requests"
        className="grid gap-3 rounded-4xl border bg-card p-4 sm:grid-cols-[minmax(10rem,0.7fr)_minmax(12rem,1fr)_auto] sm:items-end"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="request-status" className="text-sm font-medium">
            Request status
          </label>
          <select
            id="request-status"
            name="status"
            defaultValue={filters.status}
            className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <option value="all">All statuses</option>
            {stockRequestStatuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        {branchOptions.length > 0 && (
          <div className="flex flex-col gap-2">
            <label
              htmlFor="request-branch-filter"
              className="text-sm font-medium"
            >
              Branch
            </label>
            <select
              id="request-branch-filter"
              name="branch_id"
              defaultValue={filters.branch_id}
              className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <option value="all">All assigned branches</option>
              {branchOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
          </div>
        )}
        <Button type="submit" variant="outline">
          Apply filters
        </Button>
      </form>
      {page.items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">
              {hasFilters
                ? "No stock requests match these filters."
                : "No stock requests have been submitted yet."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasFilters
                ? "Change the branch or status filter to see more requests."
                : "Submit a request when a branch needs commissary stock."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <StockRequestTable page={page} />
      )}
      {pageCount > 1 && (
        <StockRequestPagination filters={filters} pageCount={pageCount} />
      )}
    </div>
  );
}
