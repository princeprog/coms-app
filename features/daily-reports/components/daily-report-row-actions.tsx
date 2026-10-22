"use client";

import Link from "next/link";
import { Building2, Ellipsis, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { businessDayLabel } from "@/features/shifts/services/shift-time";
import type { DailyReportDirectoryItem } from "../types/daily-report.types";

export function DailyReportRowActions({
  report,
  openHref,
  branchHref,
}: {
  report: DailyReportDirectoryItem;
  openHref: string;
  /** Omitted when the list already shows one branch. */
  branchHref?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${report.branch_name} report, ${businessDayLabel(report.business_date)}`}
          />
        }
      >
        <Ellipsis aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent data-coms-ui="operational" align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href={openHref} />}>
            <Eye aria-hidden="true" className="text-sky-600" />
            Open report
          </DropdownMenuItem>
          {branchHref && (
            <DropdownMenuItem render={<Link href={branchHref} />}>
              <Building2 aria-hidden="true" className="text-violet-600" />
              Show only {report.branch_name}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
