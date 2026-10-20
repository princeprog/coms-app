import { PendingReceiving } from "./pending-receiving";
import type { DispatchPage } from "@/features/dispatches/types/dispatch.types";
import type { DispatchPageFilters } from "@/features/dispatches/services/dispatch-page-params";
import { DispatchDirectory } from "./dispatch-directory";
import { DispatchCreateDialog } from "./dispatch-create-dialog";
import type {
  DispatchCreateAction,
  DispatchCreateOptions,
} from "@/features/dispatches/types/dispatch.types";

export function DispatchManagement({
  userId,
  canReceive,
  page,
  filters,
  canCreate,
  createOptions,
  createOptionsIssue,
  createAction,
}: {
  userId?: string;
  canReceive?: boolean;
  page: DispatchPage;
  filters: DispatchPageFilters;
  canCreate: boolean;
  createOptions: DispatchCreateOptions | null;
  createOptionsIssue:
    "permissions" | "forbidden" | "unavailable" | "sending-permission" | null;
  createAction: DispatchCreateAction;
}) {
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
      {userId && (
        <PendingReceiving
          key={`${filters.branchId ?? "all"}:${filters.receivingStatus ?? "pending"}`}
          userId={userId}
          canReceive={canReceive}
          branchId={filters.branchId}
          initialStatus={filters.receivingStatus}
        />
      )}
      <DispatchDirectory page={page} filters={filters} />
    </div>
  );
}
