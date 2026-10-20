"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReceivingSelect } from "./receiving-select";
import { usePendingReceiving } from "../hooks/use-pending-receiving";
import { receivingTime } from "../services/receiving-time";
import { ReceivingStatusBadge } from "./receiving-status-badge";
export function PendingReceiving({
  canReceive = false,
  userId,
  branchId,
  initialStatus = "pending",
}: {
  canReceive?: boolean;
  userId: string;
  branchId?: string;
  initialStatus?: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const query = usePendingReceiving(userId, {
    page,
    pageSize,
    receivingStatus: status,
    branchId,
  });
  const last = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));
  if (query.data && page > last) setPage(last);
  return (
    <section
      aria-labelledby="pending-receiving-title"
      className="overflow-hidden rounded-xl border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <h3 id="pending-receiving-title" className="font-semibold">
          Pending receiving{" "}
          {query.data && (
            <span className="ml-2 font-normal text-muted-foreground">
              {query.data.total}
            </span>
          )}
        </h3>
        <ReceivingSelect
          label="Receiving status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { value: "pending", label: "All pending" },
            { value: "AWAITING_COUNT", label: "Awaiting count" },
            { value: "OVERDUE", label: "Overdue" },
            { value: "REVIEW", label: "Under review" },
          ]}
        />
      </div>
      <div aria-busy={query.isFetching}>
        {query.isPending ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : query.isError ? (
          <div role="alert" className="p-4">
            {query.error.message}{" "}
            <Button variant="outline" onClick={() => void query.refetch()}>
              Retry
            </Button>
          </div>
        ) : !query.data?.items.length ? (
          <p className="p-5 text-sm text-muted-foreground">
            No pending deliveries.
          </p>
        ) : (
          <ul className="divide-y">
            {query.data.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">
                    {item.branch_name}{" "}
                    <span className="text-muted-foreground">
                      · {item.id.slice(0, 8).toUpperCase()}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent{" "}
                    {item.dispatched_at
                      ? receivingTime(item.dispatched_at)
                      : "—"}{" "}
                    · Due{" "}
                    {item.receive_by ? receivingTime(item.receive_by) : "—"} PHT
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <ReceivingStatusBadge status={item.receiving_status} />
                  <Button
                    variant="outline"
                    render={<Link href={`/dispatches/${item.id}`} />}
                  >
                    {item.receiving_status === "REVIEW"
                      ? "View review"
                      : canReceive
                        ? "Count delivery"
                        : "View delivery"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t p-3 text-sm">
        <span>
          Page {page} of {last}
        </span>
        <ReceivingSelect
          label="Pending deliveries per page"
          value={String(pageSize)}
          onChange={(value) => {
            setPageSize(Number(value));
            setPage(1);
          }}
          options={[10, 30, 50].map((size) => ({
            value: String(size),
            label: `${size} per page`,
          }))}
        />
        <Button
          variant="outline"
          disabled={page <= 1 || query.isFetching}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={page >= last || query.isFetching}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
