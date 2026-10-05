import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  createOptionsIssue:
    "permissions" | "forbidden" | "unavailable" | "sending-permission" | null;
  createAction: DispatchCreateAction;
}) {
  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
  const hasFilters =
    Boolean(filters.search) ||
    filters.status !== "all" ||
    filters.discrepancyStatus !== "all";

  return (
    <div data-coms-ui="operational" className="flex min-w-0 flex-col gap-6">
      <section
        aria-labelledby="dispatch-directory-heading"
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <h2
            id="dispatch-directory-heading"
            className="text-2xl font-semibold tracking-tight"
          >
            Dispatches
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Send commissary stock to branches and track receipts, discrepancies,
            and quantities in transit.
          </p>
        </div>
        <DispatchCreateDialog
          canCreate={canCreate}
          options={createOptions}
          optionsIssue={createOptionsIssue}
          action={createAction}
        />
      </section>
      {createOptionsIssue === "sending-permission" && (
        <p role="status" className="text-sm text-muted-foreground">
          Creating a new dispatch requires both dispatch creation and sending
          permissions. Ask an administrator to review your role.
        </p>
      )}
      <DispatchFilter filters={filters} />
      <Card className="min-w-0 gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-4 py-4 sm:px-5">
          <CardTitle>
            <h3>Branch deliveries</h3>
          </CardTitle>
          <CardDescription>
            Track delivery progress and reported discrepancies.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {page.items.length === 0 ? (
            <OperationalEmptyState
              title={
                hasFilters
                  ? "No dispatches match these filters."
                  : "No dispatches have been created yet."
              }
              description={
                hasFilters
                  ? "Change or clear the filters to see more dispatches."
                  : "Choose a branch, stock items, and quantities, then review and confirm sending. Commissary stock is deducted only on confirmation."
              }
            />
          ) : (
            <DispatchTable page={page} />
          )}
        </CardContent>
        <CardFooter className="border-t px-4 py-3 sm:px-5">
          <DispatchPagination
            filters={{ ...filters, page: page.page }}
            pageCount={pageCount}
            total={page.total}
            pageSize={page.page_size}
            itemCount={page.items.length}
          />
        </CardFooter>
      </Card>
    </div>
  );
}
