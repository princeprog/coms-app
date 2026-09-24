import Form from "next/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  dailyReportRoute,
  dailyReportStatuses,
} from "@/features/daily-reports/constants";
import type { BranchProductBranchOption } from "@/features/branch-products/types/branch-product.types";
import type { DailyReportPageFilters } from "@/features/daily-reports/services/daily-report-page-params";

export function DailyReportDirectoryToolbar({
  branches,
  filters,
}: {
  branches: BranchProductBranchOption[];
  filters: DailyReportPageFilters;
}) {
  return (
    <Form
      action={dailyReportRoute}
      aria-label="Filter daily reports"
      className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4"
    >
      <div className="grid min-w-48 gap-2">
        <Label htmlFor="daily-report-branch">Branch</Label>
        <Select name="branch_id" defaultValue={filters.branchId}>
          <SelectTrigger id="daily-report-branch" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent data-coms-ui="operational">
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
                {branch.status === "inactive" ? " (inactive)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid min-w-40 gap-2">
        <Label htmlFor="daily-report-status">Status</Label>
        <Select name="status" defaultValue={filters.status}>
          <SelectTrigger id="daily-report-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent data-coms-ui="operational">
            <SelectItem value="all">All statuses</SelectItem>
            {dailyReportStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replaceAll("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit">Apply filters</Button>
    </Form>
  );
}
