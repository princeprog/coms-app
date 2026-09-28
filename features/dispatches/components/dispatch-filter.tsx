"use client";

import { useState } from "react";
import Form from "next/form";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  dispatchStatuses,
  dispatchesRoute,
} from "@/features/dispatches/constants";
import type { DispatchPageFilters } from "@/features/dispatches/services/dispatch-page-params";

function statusLabel(status: string) {
  return status === "all" ? "All statuses" : status.replaceAll("_", " ");
}

export function DispatchFilter({ filters }: { filters: DispatchPageFilters }) {
  const [status, setStatus] = useState(filters.status);
  const [discrepancyStatus, setDiscrepancyStatus] = useState(
    filters.discrepancyStatus,
  );

  return (
    <Form
      action={dispatchesRoute}
      aria-label="Filter dispatches"
      className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_auto] lg:items-end"
    >
      <Field className="min-w-0">
        <FieldLabel htmlFor="dispatch-status">Dispatch status</FieldLabel>
        <Select
          value={status}
          onValueChange={(value) =>
            setStatus((value as typeof filters.status | null) ?? "all")
          }
        >
          <SelectTrigger id="dispatch-status" className="w-full">
            <SelectValue>
              {(value: unknown) => statusLabel(String(value))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent data-coms-ui="operational">
            <SelectItem value="all">All statuses</SelectItem>
            {dispatchStatuses.map((dispatchStatus) => (
              <SelectItem key={dispatchStatus} value={dispatchStatus}>
                {statusLabel(dispatchStatus)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="status" value={status} />
      </Field>
      <Field className="min-w-0">
        <FieldLabel htmlFor="dispatch-discrepancy-status">Discrepancy</FieldLabel>
        <Select
          value={discrepancyStatus}
          onValueChange={(value) =>
            setDiscrepancyStatus(
              (value as typeof filters.discrepancyStatus | null) ?? "all",
            )
          }
        >
          <SelectTrigger id="dispatch-discrepancy-status" className="w-full">
            <SelectValue>
              {(value: unknown) => discrepancyLabel(String(value))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent data-coms-ui="operational">
            <SelectItem value="all">All discrepancies</SelectItem>
            <SelectItem value="NONE">No discrepancy</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="RECOUNT_REQUESTED">Recount requested</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <input
          type="hidden"
          name="discrepancy_status"
          value={discrepancyStatus}
        />
      </Field>
      <Button type="submit" variant="outline" className="w-fit">
        Apply filters
      </Button>
    </Form>
  );
}

function discrepancyLabel(status: string) {
  if (status === "all") return "All discrepancies";
  if (status === "NONE") return "No discrepancy";
  if (status === "RECOUNT_REQUESTED") return "Recount requested";
  return status.toLowerCase();
}
