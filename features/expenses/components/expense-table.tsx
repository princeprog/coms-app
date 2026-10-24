"use client";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Expense } from "../schemas/expense.schema";
import { expenseDate, pesos, sourceLabels } from "../services/expense-format";

export type ExpenseSelection = {
  record: Expense;
  mode: "detail" | "edit" | "void";
};
export function ExpenseStatus({ status }: { status: Expense["status"] }) {
  return (
    <Badge
      className={
        status === "RECORDED"
          ? "bg-emerald-700 text-white dark:bg-emerald-700"
          : "bg-red-700 text-white dark:bg-red-700"
      }
    >
      {status === "RECORDED" ? "Recorded" : "Voided"}
    </Badge>
  );
}
export function ExpenseTable({
  items,
  canEdit,
  canVoid,
  onSelect,
}: {
  items: Expense[];
  canEdit: boolean;
  canVoid: boolean;
  onSelect: (selection: ExpenseSelection) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Expense</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((record) => (
            <TableRow key={`${record.source}:${record.id}`}>
              <TableCell className="max-w-72 whitespace-normal">
                <p className="font-medium">{record.description}</p>
                <p className="text-xs text-muted-foreground">
                  {sourceLabels[record.source]}
                  {record.payee ? ` · ${record.payee}` : ""}
                </p>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {expenseDate(record.expense_date)}
              </TableCell>
              <TableCell>{record.location_name}</TableCell>
              <TableCell>{record.category_name}</TableCell>
              <TableCell className="text-right tabular-nums">
                {pesos(record.amount)}
              </TableCell>
              <TableCell>
                <ExpenseStatus status={record.status} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Actions for ${record.description}`}
                      />
                    }
                  >
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" data-coms-ui="operational">
                    <DropdownMenuItem
                      onClick={() => onSelect({ record, mode: "detail" })}
                    >
                      View details &amp; history
                    </DropdownMenuItem>
                    {record.source === "OPERATING" &&
                      record.status === "RECORDED" && (
                        <>
                          {canEdit && (
                            <DropdownMenuItem
                              onClick={() => onSelect({ record, mode: "edit" })}
                            >
                              Edit expense
                            </DropdownMenuItem>
                          )}
                          {canVoid && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  onSelect({ record, mode: "void" })
                                }
                              >
                                Void expense
                              </DropdownMenuItem>
                            </>
                          )}
                        </>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
