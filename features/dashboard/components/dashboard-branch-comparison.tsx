import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DashboardData } from "@/features/dashboard/schemas/dashboard.schema";

export function DashboardBranchComparison({ data }: { data: DashboardData }) {
  if (data.branches.length < 2) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branch performance</CardTitle>
        <CardDescription>
          Compare sales, report completion, and dispatch follow-up across
          branches.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table
          aria-label="Branch performance comparison"
          containerProps={{
            role: "region",
            "aria-label": "Branch performance table",
            tabIndex: 0,
            className: "rounded-md border",
          }}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Completed sales</TableHead>
              <TableHead className="text-right">Reports</TableHead>
              <TableHead className="text-right">Open issues</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.branches.map((branch) => (
              <TableRow key={branch.branch_id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard?branch_id=${branch.branch_id}`}
                    className={buttonVariants({ variant: "link", size: "sm" })}
                  >
                    {branch.branch_name}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(branch.completed_sales_amount)}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({branch.completed_sales_count})
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {branch.submitted_reports_count} submitted ·{" "}
                  {branch.approved_reports_count} approved
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {branch.open_discrepancies_count} discrepancies ·{" "}
                  {branch.in_transit_dispatches_count} in transit
                </TableCell>
                <TableCell className="text-right capitalize">
                  {branch.branch_status}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function formatAmount(value: string) {
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(
    Number(value),
  );
}
