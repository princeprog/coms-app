import Link from "next/link";
import { format, parseISO } from "date-fns";
import { DispatchCreateControl } from "@/features/dispatches/components/dispatch-create-control";
import type { DispatchCreateAction } from "@/features/dispatches/types/dispatch.types";
import { OperationalStatusBadge } from "@/components/shared/operational-page-ui";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  StockRequest,
  StockRequestTransitionAction,
} from "@/features/stock-requests/types/stock-request.types";
import { StockRequestTransitionDialog } from "./stock-request-transition-dialog";

export function StockRequestDetailView({
  request,
  canApprove,
  canReject,
  canCancel,
  transitionAction,
  canCreateDispatch,
  createDispatchAction,
}: {
  request: StockRequest;
  canApprove: boolean;
  canReject: boolean;
  canCancel: boolean;
  transitionAction: StockRequestTransitionAction;
  canCreateDispatch: boolean;
  createDispatchAction: DispatchCreateAction;
}) {
  const pending = request.status === "PENDING";
  const showDispatchCreation =
    request.status === "APPROVED" && canCreateDispatch;

  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          href="/replenishment"
          aria-label="Back to replenishment"
        >
          Back to requests
        </Link>
        {showDispatchCreation && (
          <DispatchCreateControl
            stockRequestId={request.id}
            action={createDispatchAction}
          />
        )}
        {pending && (canApprove || canReject || canCancel) && (
          <div className="flex flex-wrap gap-2">
            {canApprove && (
              <StockRequestTransitionDialog
                requestId={request.id}
                transition="approve"
                action={transitionAction}
              />
            )}
            {canReject && (
              <StockRequestTransitionDialog
                requestId={request.id}
                transition="reject"
                action={transitionAction}
              />
            )}
            {canCancel && (
              <StockRequestTransitionDialog
                requestId={request.id}
                transition="cancel"
                action={transitionAction}
              />
            )}
          </div>
        )}
      </div>
      <section
        aria-labelledby="request-summary-heading"
        className="rounded-lg border bg-card"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 md:p-5">
          <div className="flex flex-col gap-1">
            <h2 id="request-summary-heading" className="text-lg font-semibold">
              Stock request
            </h2>
            <p className="text-sm text-muted-foreground">
              {request.branch_name} · requested by {request.requester_name}
            </p>
          </div>
          <OperationalStatusBadge variant="outline">
            {request.status}
          </OperationalStatusBadge>
        </div>
        <dl className="grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2 lg:grid-cols-3 md:p-5">
          <DetailField
            label="Submitted"
            value={format(parseISO(request.created_at), "PPp")}
          />
          <DetailField
            label="Requested items"
            value={String(request.items.length)}
          />
          <DetailField
            label="Last updated"
            value={format(parseISO(request.updated_at), "PPp")}
          />
        </dl>
      </section>
      <section
        aria-labelledby="requested-items-heading"
        className="flex flex-col gap-3"
      >
        <div>
          <h2 id="requested-items-heading" className="text-lg font-semibold">
            Requested items
          </h2>
          <p className="text-sm text-muted-foreground">
            Requested quantities do not change inventory until dispatch.
          </p>
        </div>
        <Table
          aria-label="Requested stock items"
          containerProps={{
            role: "region",
            "aria-label": "Requested stock items table",
            tabIndex: 0,
            className: "rounded-lg border",
          }}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Stock item</TableHead>
              <TableHead className="text-right">Quantity requested</TableHead>
              <TableHead>Unit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {request.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.stock_item_name}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.quantity_requested}
                </TableCell>
                <TableCell>{item.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <section
        aria-labelledby="request-history-heading"
        className="flex flex-col gap-3"
      >
        <div>
          <h2 id="request-history-heading" className="text-lg font-semibold">
            Request history
          </h2>
          <p className="text-sm text-muted-foreground">
            Recorded request submissions and workflow transitions.
          </p>
        </div>
        <ol
          aria-label="Stock request history"
          className="divide-y rounded-lg border bg-card"
        >
          {request.events.map((event) => (
            <li
              key={event.id}
              className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {event.event_type.replaceAll("_", " ")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {event.actor_name}
                </p>
              </div>
              <time
                className="text-sm text-muted-foreground"
                dateTime={event.created_at}
              >
                {format(parseISO(event.created_at), "PPp")}
              </time>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
