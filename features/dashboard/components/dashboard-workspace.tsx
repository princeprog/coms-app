"use client";

import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { AlertCircleIcon, RotateCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  hasPermission,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";
import {
  getBranchDashboardAction,
  getGlobalDashboardAction,
} from "@/features/dashboard/services/dashboard-actions";
import {
  getDashboardDateRange,
  type DashboardRangeDays,
} from "@/features/dashboard/services/dashboard-date-range";
import type { DashboardData } from "@/features/dashboard/schemas/dashboard.schema";
import { DashboardFilters } from "./dashboard-filters";
import { DashboardBranchComparison } from "./dashboard-branch-comparison";
import { DashboardLoading, DashboardMessage } from "./dashboard-states";
import { DashboardSalesTrend } from "./dashboard-sales-trend";
import { DashboardSummaryCards } from "./dashboard-summary-cards";

export function DashboardWorkspace({
  user,
  requestedBranchId,
  initialRange,
}: {
  user: User;
  requestedBranchId?: string;
  initialRange: { from: string; to: string };
}) {
  const isSuperAdmin = isProtectedSuperAdmin(user);
  const canViewGlobal =
    isSuperAdmin || hasPermission(user, "dashboard.global_read");
  const canViewBranch = isSuperAdmin || hasPermission(user, "dashboard.read");
  const assignedBranchIds = user.branch_ids ?? [];
  const canLoadAssigned = !canViewGlobal && canViewBranch;
  const initialBranchId =
    requestedBranchId &&
    (!canLoadAssigned || assignedBranchIds.includes(requestedBranchId))
      ? requestedBranchId
      : canLoadAssigned
        ? assignedBranchIds[0]
        : undefined;
  const [rangeDays, setRangeDays] = useState<DashboardRangeDays>(30);
  const [selectedBranchId, setSelectedBranchId] = useState(
    canViewGlobal ? (requestedBranchId ?? "all") : (initialBranchId ?? ""),
  );
  const range = useMemo(
    () =>
      rangeDays === 30 && initialRange
        ? initialRange
        : getDashboardDateRange(rangeDays),
    [initialRange, rangeDays],
  );

  const globalOptionsQuery = useQuery({
    queryKey: ["dashboard", "global", range.from, range.to, "all"],
    enabled: canViewGlobal,
    queryFn: async () => {
      const result = await getGlobalDashboardAction(range);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });
  const globalBranchQuery = useQuery({
    queryKey: ["dashboard", "global", range.from, range.to, selectedBranchId],
    enabled: canViewGlobal && selectedBranchId !== "all",
    queryFn: async () => {
      const result = await getGlobalDashboardAction({
        ...range,
        branch_id: selectedBranchId,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const branchQueries = useQueries({
    queries: canLoadAssigned
      ? assignedBranchIds.map((branchId) => ({
          queryKey: ["dashboard", "branch", branchId, range.from, range.to],
          queryFn: async () => {
            const result = await getBranchDashboardAction(branchId, range);
            if (!result.ok) throw new Error(result.error);
            return result.data;
          },
        }))
      : [],
  });

  const activeBranchQueryIndex = canLoadAssigned
    ? assignedBranchIds.indexOf(selectedBranchId)
    : -1;
  const activeBranchQuery =
    activeBranchQueryIndex >= 0 ? branchQueries[activeBranchQueryIndex] : null;
  const data: DashboardData | undefined = canViewGlobal
    ? selectedBranchId === "all"
      ? globalOptionsQuery.data
      : globalBranchQuery.data
    : activeBranchQuery?.data;
  const branches = canViewGlobal
    ? (globalOptionsQuery.data?.branches ?? [])
    : branchQueries.flatMap((query) => query.data?.branches ?? []);
  const isLoading = canViewGlobal
    ? selectedBranchId === "all"
      ? globalOptionsQuery.isLoading
      : globalBranchQuery.isLoading || globalOptionsQuery.isLoading
    : canLoadAssigned && branchQueries.some((query) => query.isPending);
  const error = canViewGlobal
    ? (globalBranchQuery.error ?? globalOptionsQuery.error)
    : (activeBranchQuery?.error ??
      branchQueries.find((query) => query.isError)?.error);

  if (!canViewGlobal && !canViewBranch) {
    return (
      <DashboardMessage
        title="Dashboard unavailable"
        description="Your role does not include dashboard access. Ask an administrator to review your permissions."
      />
    );
  }
  if (!canViewGlobal && assignedBranchIds.length === 0) {
    return (
      <DashboardMessage
        title="No branch assigned"
        description="Dashboard data is limited to an active branch assigned to your account. Ask an administrator to assign a branch."
      />
    );
  }

  const currentBranchName = data?.branches[0]?.branch_name;
  const currentBranchStatus = data?.branches[0]?.branch_status;
  const retry = canViewGlobal
    ? () => {
        void globalOptionsQuery.refetch();
        if (selectedBranchId !== "all") void globalBranchQuery.refetch();
      }
    : () => void activeBranchQuery?.refetch();

  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Operational performance from {range.from} to {range.to}{" "}
            (Asia/Manila).
          </p>
          {currentBranchName && (
            <p className="text-sm font-medium">
              {currentBranchName}
              {currentBranchStatus === "inactive" && (
                <span className="ml-2 rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                  Inactive branch
                </span>
              )}
            </p>
          )}
        </div>
        <DashboardFilters
          branches={branches}
          canViewGlobal={canViewGlobal}
          rangeDays={rangeDays}
          selectedBranchId={selectedBranchId}
          onRangeDaysChange={setRangeDays}
          onBranchChange={setSelectedBranchId}
        />
      </header>

      {isLoading ? (
        <DashboardLoading />
      ) : error ? (
        <Card role="alert">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircleIcon aria-hidden="true" /> Dashboard data unavailable
            </CardTitle>
            <CardDescription>
              {error instanceof Error
                ? error.message
                : "COMS could not load dashboard data."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" onClick={retry}>
              <RotateCwIcon /> Retry
            </Button>
          </CardContent>
        </Card>
      ) : data ? (
        data.branches.length === 0 ? (
          <DashboardMessage
            title="No branch data"
            description="No branches are available for this dashboard period."
          />
        ) : (
          <>
            <DashboardSummaryCards data={data} />
            <DashboardSalesTrend data={data} />
            {canViewGlobal && <DashboardBranchComparison data={data} />}
          </>
        )
      ) : (
        <DashboardMessage
          title="Dashboard data unavailable"
          description="No dashboard response was returned. Refresh the page to try again."
        />
      )}
    </div>
  );
}
