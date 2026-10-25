"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Info, Plus, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DirectorySelect } from "@/components/shared/directory-select";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { schedulesRoute, shiftTemplatesRoute } from "../constants";
import { useRefreshSchedules, useShiftTemplates } from "../hooks/use-schedules";
import {
  clockLabel,
  lengthLabel,
  timeRange,
  weekdaysLabel,
} from "../services/schedule-format";
import { ShiftTemplateDialog } from "./shift-template-dialog";
import { ShiftTemplateRowActions } from "./shift-template-row-actions";

const press =
  "transition-[scale,background-color] duration-150 ease-out active:scale-97 motion-reduce:active:scale-100";

export function ShiftTemplatesWorkspace({
  branches,
  branchId,
  canManage,
  dayStartTimes,
}: {
  branches: { id: string; name: string }[];
  branchId: string;
  canManage: boolean;
  dayStartTimes: string[];
}) {
  const router = useRouter();
  const templates = useShiftTemplates(branchId);
  const refresh = useRefreshSchedules();
  const [adding, setAdding] = useState(false);
  const branchName =
    branches.find((branch) => branch.id === branchId)?.name ?? "this branch";
  const dayStart = dayStartTimes[0] ?? "00:00";
  const rows = templates.data ?? [];
  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={`${schedulesRoute}?branch=${branchId}`}
            className="flex w-fit items-center gap-1.5 rounded text-sm text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Schedules
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Branch shifts
          </h1>
          <p className="text-sm text-muted-foreground">
            Shift hours for {branchName}. Assign staff on the schedule.
          </p>
        </div>
        {canManage && (
          <Button
            className={cn("min-h-11 gap-2", press)}
            onClick={() => setAdding(true)}
          >
            <Plus aria-hidden="true" data-icon="inline-start" />
            Add shift
          </Button>
        )}
      </header>
      <div className="flex flex-wrap items-center gap-3">
        {branches.length > 1 && (
          <DirectorySelect
            id="shift-templates-branch"
            label="Branch"
            hideLabel
            alignItemWithTrigger={false}
            className="sm:w-60 [&_[data-slot=select-trigger]]:h-11 [&_[data-slot=select-trigger]]:px-3"
            value={branchId}
            options={branches.map((branch) => ({
              value: branch.id,
              label: branch.name,
              icon: <Building2 className="text-sky-600" />,
            }))}
            onChange={(value) =>
              router.push(`${shiftTemplatesRoute}?branch=${value}`)
            }
          />
        )}
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info aria-hidden="true" className="size-4 shrink-0 text-sky-600" />
          The business day starts at {clockLabel(dayStart)}. Shifts end by then,
          so a night shift ends at {clockLabel(dayStart)}.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        {templates.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 px-6 py-12 text-center"
          >
            <p>Shifts could not be loaded.</p>
            <Button variant="outline" onClick={() => templates.refetch()}>
              Try again
            </Button>
          </div>
        ) : !templates.isPending && rows.length === 0 ? (
          <div className="px-6 py-10">
            <OperationalEmptyState
              title="No shifts yet"
              description={`Add the shifts ${branchName} runs, such as Morning and Closing. A 24-hour branch needs shifts that cover the whole day.`}
              actions={
                canManage && (
                  <Button
                    className={cn("min-h-11 gap-2", press)}
                    onClick={() => setAdding(true)}
                  >
                    <Plus aria-hidden="true" data-icon="inline-start" />
                    Add shift
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <Table
            aria-label="Branch shifts"
            aria-busy={templates.isFetching}
            className="min-w-2xl"
          >
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-5">Shift</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Status</TableHead>
                {canManage && (
                  <TableHead className="w-12 pr-4">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.isPending
                ? Array.from({ length: 3 }, (_, index) => (
                    <TableRow key={index}>
                      <TableCell
                        colSpan={canManage ? 6 : 5}
                        className="px-5 py-4"
                      >
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : rows.map((template) => (
                    <TableRow
                      key={template.id}
                      className={cn(
                        !template.is_active && "text-muted-foreground",
                      )}
                    >
                      <TableCell className="py-3.5 pl-5 font-medium">
                        {template.name}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {timeRange(template.start_time, template.end_time)}
                        <span className="block text-xs text-muted-foreground">
                          {lengthLabel(template.start_time, template.end_time)}
                        </span>
                      </TableCell>
                      <TableCell>{weekdaysLabel(template.weekdays)}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 tabular-nums">
                          <UsersRound
                            aria-hidden="true"
                            className="size-4 text-violet-600"
                          />
                          {template.staff_count}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-white",
                            template.is_active
                              ? "bg-emerald-600"
                              : "bg-red-600",
                          )}
                        >
                          {template.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell className="pr-4 text-right">
                          <ShiftTemplateRowActions
                            branchId={branchId}
                            template={template}
                            dayStartTimes={dayStartTimes}
                            onChanged={refresh}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </div>
      {canManage && (
        <p className="text-sm text-muted-foreground">
          Ready to assign people?{" "}
          <Link
            href={`${schedulesRoute}?branch=${branchId}`}
            className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}
          >
            Open the schedule
          </Link>
        </p>
      )}
      {adding && (
        <ShiftTemplateDialog
          branchId={branchId}
          dayStartTimes={dayStartTimes}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            void refresh();
          }}
        />
      )}
    </div>
  );
}
