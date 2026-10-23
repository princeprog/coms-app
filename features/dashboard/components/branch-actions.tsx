"use client";

import Link from "next/link";
import { Ellipsis, FileText, ReceiptText, Truck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shiftHref } from "@/features/shifts/constants";
import type {
  BranchToday,
  DashboardToday,
  ReportProgress,
} from "../schemas/dashboard-today.schema";
import {
  reportProgressHref,
  salesReportHref,
} from "../services/dashboard-links";

export function BranchActions({
  branch,
  reports,
  access,
}: {
  branch: BranchToday;
  reports: ReportProgress[];
  access: DashboardToday["access"];
}) {
  if (!Object.values(access).some(Boolean)) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${branch.branch_name}`}
          />
        }
      >
        <Ellipsis aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-coms-ui="operational">
        <DropdownMenuGroup>
          {access.reports &&
            reports.map((report) => (
              <DropdownMenuItem
                key={report.period}
                render={<Link href={reportProgressHref(report)} />}
              >
                <FileText aria-hidden="true" />
                {report.period === "today"
                  ? "Today's report"
                  : "Yesterday's report"}
              </DropdownMenuItem>
            ))}
          {access.shifts && (
            <DropdownMenuItem
              render={
                <Link
                  href={
                    branch.shift_id
                      ? shiftHref(branch.branch_id, branch.shift_id)
                      : `/shifts?branch=${branch.branch_id}`
                  }
                />
              }
            >
              <Wallet aria-hidden="true" />
              {branch.shift_id ? "Current shift" : "View shifts"}
            </DropdownMenuItem>
          )}
          {access.dispatches && (
            <DropdownMenuItem
              render={
                <Link href={`/dispatches?branch_id=${branch.branch_id}`} />
              }
            >
              <Truck aria-hidden="true" />
              View deliveries
            </DropdownMenuItem>
          )}
          {access.sales && (
            <DropdownMenuItem
              render={<Link href={salesReportHref(branch.branch_id)} />}
            >
              <ReceiptText aria-hidden="true" />
              Sales report
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
