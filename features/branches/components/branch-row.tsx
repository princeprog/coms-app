import { MapPin, ShoppingBag, Utensils } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { BranchRowActions } from "./branch-row-actions";
import { cn } from "@/lib/utils";
import type { Branch } from "../types/branch.types";

export function BranchRow({
  branch,
  canUpdate,
  canDeactivate,
  onComplete,
}: {
  branch: Branch;
  canUpdate: boolean;
  canDeactivate: boolean;
  onComplete: (message: string) => void;
}) {
  const opened = branch.date_opened
    ? format(parseISO(branch.date_opened.slice(0, 10)), "MMM d, yyyy")
    : "Not recorded";
  const services = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
      {branch.has_dine_in && (
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <Utensils
            aria-hidden="true"
            className="size-5 text-muted-foreground"
          />
          Dine-in
        </span>
      )}
      {branch.has_takeaway !== false && (
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <ShoppingBag
            aria-hidden="true"
            className="size-5 text-muted-foreground"
          />
          Takeout
        </span>
      )}
      {!branch.has_dine_in && branch.has_takeaway === false && (
        <span className="text-muted-foreground">No services</span>
      )}
    </div>
  );
  return (
    <TableRow>
      <TableCell className="min-w-40 px-3 py-2.5 align-top whitespace-normal sm:w-2/5 sm:px-4 sm:align-middle">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-base font-semibold break-words">
              {branch.branch_name}
            </span>
            <span className="text-sm break-all text-muted-foreground">
              {branch.code}
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <span className="break-words">
              {branch.address || "Address not recorded"}
            </span>
          </div>
          <div className="pt-1 md:hidden">{services}</div>
          <span className="text-xs text-muted-foreground lg:hidden">
            Opened: {opened}
          </span>
        </div>
      </TableCell>
      <TableCell className="hidden w-1/4 px-4 whitespace-normal md:table-cell">
        {services}
      </TableCell>
      <TableCell className="hidden px-4 lg:table-cell">{opened}</TableCell>
      <TableCell className="px-2 py-4 align-top sm:px-4 sm:align-middle">
        <Badge
          className={cn(
            "h-auto rounded-md px-3 py-1 text-white",
            branch.status === "active" ? "bg-green-700" : "bg-red-700",
          )}
        >
          {branch.status === "active" ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="px-2 py-3 text-right align-top sm:px-4 sm:align-middle">
        <BranchRowActions
          branch={branch}
          canUpdate={canUpdate}
          canDeactivate={canDeactivate}
          onComplete={onComplete}
        />
      </TableCell>
    </TableRow>
  );
}
