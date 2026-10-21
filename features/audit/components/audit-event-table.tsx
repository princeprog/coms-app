"use client";

import { Ellipsis, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditArea, AuditEvent } from "../schemas/audit.schema";
import {
  auditAreaLabels,
  changeSummary,
  describeAction,
  formatAuditTime,
} from "../services/audit-format";

export function AuditEventTable({
  events,
  onView,
}: {
  events: AuditEvent[];
  onView: (event: AuditEvent) => void;
}) {
  return (
    <Table
      aria-label="Audit events"
      className="min-w-3xl"
      containerProps={{
        role: "region",
        "aria-label": "Audit events table",
        tabIndex: 0,
      }}
    >
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className="pl-4">
            When
          </TableHead>
          <TableHead scope="col">Who</TableHead>
          <TableHead scope="col">Action</TableHead>
          <TableHead scope="col">Record</TableHead>
          <TableHead scope="col" className="w-12 pr-4">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => {
          const summary = changeSummary(event);
          const action = describeAction(event);
          return (
            <TableRow key={event.id}>
              <TableCell className="pl-4 text-muted-foreground tabular-nums">
                {formatAuditTime(event.occurred_at)}
              </TableCell>
              <TableCell>
                {event.actor_name ?? (
                  <span className="text-muted-foreground">System</span>
                )}
              </TableCell>
              <TableCell className="whitespace-normal">
                <span className="font-medium">{action}</span>
                {summary && (
                  <span className="block text-xs text-muted-foreground">
                    {summary}
                  </span>
                )}
              </TableCell>
              <TableCell className="whitespace-normal">
                <span>{event.entity_label ?? "—"}</span>
                <span className="block text-xs text-muted-foreground">
                  {auditAreaLabels[event.entity_type as AuditArea] ??
                    event.entity_type}
                </span>
              </TableCell>
              <TableCell className="pr-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${action}${event.entity_label ? ` on ${event.entity_label}` : ""}`}
                      />
                    }
                  >
                    <Ellipsis aria-hidden="true" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent data-coms-ui="operational" align="end">
                    <DropdownMenuItem onClick={() => onView(event)}>
                      <Eye aria-hidden="true" />
                      View details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
