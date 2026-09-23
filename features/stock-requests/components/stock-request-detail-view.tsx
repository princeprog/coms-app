import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DispatchCreateControl } from "@/features/dispatches/components/dispatch-create-control";
import type { DispatchCreateAction } from "@/features/dispatches/types/dispatch.types";
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/replenishment"
        >
          Back to replenishment
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
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Stock request</CardTitle>
            <p className="text-sm text-muted-foreground">
              {request.branch_name} · requested by {request.requester_name}
            </p>
          </div>
          <Badge variant="outline">{request.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
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
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Requested items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table aria-label="Requested stock items">
            <TableHeader>
              <TableRow>
                <TableHead>Stock item</TableHead>
                <TableHead>Quantity requested</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.stock_item_name}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {item.quantity_requested}
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Request history</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-4">
            {request.events.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-1 border-l-2 pl-4 sm:flex-row sm:items-center sm:justify-between"
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
        </CardContent>
      </Card>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}
