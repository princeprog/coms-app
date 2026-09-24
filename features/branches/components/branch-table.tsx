import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BranchRow } from "@/features/branches/components/branch-row";
import type { BranchPage } from "@/features/branches/types/branch.types";

type BranchAccess = Record<
  string,
  { canUpdate: boolean; canDeactivate: boolean }
>;

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
    <div className="overflow-x-auto">
      <Table aria-label="Branches">
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>Branch</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Date opened</TableHead>
            <TableHead>Dine-in</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.items.map((branch) => (
            <BranchRow
              key={branch.id}
              branch={branch}
              canUpdate={branchAccess[branch.id]?.canUpdate ?? false}
              canDeactivate={branchAccess[branch.id]?.canDeactivate ?? false}
              onComplete={onComplete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
