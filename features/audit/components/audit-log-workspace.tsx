"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  OperationalEmptyState,
  OperationalPagination,
} from "@/components/shared/operational-page-ui";
import { TablePageSize } from "@/components/shared/table-page-size";
import { useAuditQuery } from "../hooks/use-audit-query";
import { auditKeys } from "../query-keys";
import type { AuditEvent } from "../schemas/audit.schema";
import { getAuditEventsAction } from "../services/audit-actions";
import { AuditEventSheet } from "./audit-event-sheet";
import { AuditEventTable } from "./audit-event-table";
import { AuditLogFilters } from "./audit-log-filters";

export function AuditLogWorkspace() {
  const auditQuery = useAuditQuery();
  const { query, href } = auditQuery;
  const [viewing, setViewing] = useState<AuditEvent | null>(null);
  const invalidRange = Boolean(query.from && query.to && query.from > query.to);
  const result = useQuery({
    queryKey: auditKeys.list(query),
    queryFn: async () => {
      const response = await getAuditEventsAction(query);
      if (!response.ok) throw new Error(response.error);
      return response.data;
    },
    enabled: !invalidRange,
    retry: false,
  });
  const filtered = Boolean(
    query.search || query.area || query.from || query.to,
  );
  const total = result.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / query.page_size));
  const first = total ? (query.page - 1) * query.page_size + 1 : 0;
  const last = Math.min(query.page * query.page_size, total);
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Audit log
        </h1>
        <p className="text-sm text-muted-foreground">
          Who changed settings, access and costs, and when.
        </p>
      </header>
      <AuditLogFilters auditQuery={auditQuery} />
      <section
        aria-label="Audit events"
        aria-busy={result.isFetching}
        className="rounded-xl border"
      >
        {invalidRange ? null : result.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 px-6 py-12 text-center"
          >
            <p>{result.error.message}</p>
            <Button variant="outline" onClick={() => result.refetch()}>
              Try again
            </Button>
          </div>
        ) : result.isPending ? (
          <div
            role="status"
            aria-busy="true"
            aria-label="Loading audit events"
            className="flex flex-col gap-2 p-4"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
        ) : result.data.items.length === 0 ? (
          <div className="px-6 py-10">
            <OperationalEmptyState
              title={filtered ? "No events match" : "No changes recorded yet"}
              description={
                filtered
                  ? "Change the search, area or dates to see more events."
                  : "Changes to settings, staff access and costs will appear here."
              }
            />
          </div>
        ) : (
          <>
            <AuditEventTable events={result.data.items} onView={setViewing} />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
              <span className="text-sm text-muted-foreground tabular-nums">
                Showing {first}–{last} of {total}{" "}
                {total === 1 ? "event" : "events"}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <TablePageSize pageSize={query.page_size} href={href({})} />
                <OperationalPagination
                  ariaLabel="Audit event pages"
                  page={query.page}
                  pageCount={pageCount}
                  previousHref={
                    query.page > 1 ? href({ page: query.page - 1 }) : undefined
                  }
                  nextHref={
                    query.page < pageCount
                      ? href({ page: query.page + 1 })
                      : undefined
                  }
                />
              </div>
            </div>
          </>
        )}
      </section>
      <AuditEventSheet
        event={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      />
    </div>
  );
}
