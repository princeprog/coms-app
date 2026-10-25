import { ShoppingBag, Utensils } from "lucide-react";
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
    : null;
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
      <TableCell className="min-w-40 px-3 py-3 align-top whitespace-normal sm:w-2/5 sm:px-4 sm:align-middle">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium break-words">{branch.branch_name}</span>
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span className="shrink-0">{branch.code}</span>
            {branch.address && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className="max-w-56 truncate sm:max-w-80"
                  title={branch.address}
                >
                  {branch.address}
                </span>
              </>
            )}
          </span>
          <div className="pt-1.5 md:hidden">{services}</div>
          {opened && (
            <span className="text-xs text-muted-foreground lg:hidden">
              Opened {opened}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden w-1/4 px-4 whitespace-normal md:table-cell">
        {services}
      </TableCell>
      <TableCell className="hidden px-4 lg:table-cell">
        {opened ?? <span className="text-muted-foreground">—</span>}
      </TableCell>
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
