import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BranchRow } from "./branch-row";
import type { BranchAccess, BranchPage } from "../types/branch.types";

export function BranchTable({
  branches,
  branchAccess,
  onComplete,
}: {
  branches: BranchPage;
  branchAccess: BranchAccess;
  onComplete: (message: string) => void;
}) {
  return (
    <Table
      aria-label="Branches"
      containerProps={{
        role: "region",
        "aria-label": "Branch directory",
        tabIndex: 0,
        className:
          "rounded-lg focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
      }}
    >
      <TableHeader className="bg-muted/40">
        <TableRow>
          <TableHead scope="col" className="h-11 px-3 sm:px-4">
            Branch
          </TableHead>
          <TableHead scope="col" className="hidden h-11 px-4 md:table-cell">
            Services
          </TableHead>
          <TableHead scope="col" className="hidden h-11 px-4 lg:table-cell">
            Opened
          </TableHead>
          <TableHead scope="col" className="h-11 px-2 sm:px-4">
            Status
          </TableHead>
          <TableHead scope="col" className="h-11 px-2 text-right sm:px-4">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {branches.items.map((branch) => (
          <BranchRow
            key={branch.id}
            branch={branch}
            canUpdate={branchAccess[branch.id]?.canUpdate ?? false}
            canDeactivate={branchAccess[branch.id]?.canDeactivate ?? false}
            canManageDevices={branchAccess[branch.id]?.canManageDevices ?? false}
            canReviewOffline={branchAccess[branch.id]?.canReviewOffline ?? false}
            onComplete={onComplete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
