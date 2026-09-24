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
import type { Branch } from "@/features/branches/types/branch.types";
import {
  stockRequestStatuses,
  stockRequestsRoute,
} from "@/features/stock-requests/constants";
import type { StockRequestPageFilters } from "@/features/stock-requests/services/stock-request-page-params";

function statusLabel(status: string) {
  if (status === "all") return "All statuses";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function StockRequestFilter({
  filters,
  branchOptions,
}: {
  filters: StockRequestPageFilters;
  branchOptions: Branch[];
}) {
  const [statusChoice, setStatusChoice] = useState(filters.status);
  const [branchChoice, setBranchChoice] = useState(filters.branch_id);

  return (
    <Form
      action={stockRequestsRoute}
      aria-label="Filter stock requests"
      className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 sm:items-end lg:grid-cols-[minmax(10rem,0.7fr)_minmax(12rem,1fr)_auto]"
    >
      <Field className="min-w-0">
        <FieldLabel htmlFor="request-status">Request status</FieldLabel>
        <Select
          value={statusChoice}
          onValueChange={(value) =>
            setStatusChoice((value as typeof filters.status | null) ?? "all")
          }
        >
          <SelectTrigger id="request-status" className="w-full">
            <SelectValue>
              {(value: unknown) => statusLabel(String(value))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent data-coms-ui="operational">
            <SelectItem value="all">All statuses</SelectItem>
            {stockRequestStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {statusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="status" value={statusChoice} />
      </Field>
      {branchOptions.length > 0 ? (
        <Field className="min-w-0">
          <FieldLabel htmlFor="request-branch-filter">Branch</FieldLabel>
          <Select
            value={branchChoice}
            onValueChange={(value) => setBranchChoice(value ?? "all")}
          >
            <SelectTrigger id="request-branch-filter" className="w-full">
              <SelectValue>
                {(value: unknown) =>
                  value === "all"
                    ? "All assigned branches"
                    : (branchOptions.find((branch) => branch.id === value)
                        ?.branch_name ?? "Select a branch")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent data-coms-ui="operational">
              <SelectItem value="all">All assigned branches</SelectItem>
              {branchOptions.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.branch_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="branch_id" value={branchChoice} />
        </Field>
      ) : filters.branch_id !== "all" ? (
        <input type="hidden" name="branch_id" value={branchChoice} />
      ) : null}
      <Button type="submit" variant="outline" className="w-fit">
        Apply filters
      </Button>
    </Form>
  );
}
