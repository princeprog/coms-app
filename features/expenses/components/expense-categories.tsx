"use client";
import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { useExpenseCategories } from "../hooks/use-expenses";
import type { ExpenseCategory } from "../schemas/expense.schema";
import { ExpenseError, ExpenseLoading } from "./expense-feedback";
import { ExpenseCategoryEditor } from "./expense-category-editor";
import { ExpenseCategoryStatus } from "./expense-category-status";

export function ExpenseCategories() {
  const query = useExpenseCategories();
  const [editor, setEditor] = useState<{ record?: ExpenseCategory } | null>(
    null,
  );
  const [status, setStatus] = useState<ExpenseCategory | null>(null);
  return (
    <div className="space-y-5">
      <Link
        href="/expenses"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Back to expenses
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Expense categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, rename or deactivate categories while preserving expense
            history.
          </p>
        </div>
        <Button onClick={() => setEditor({})}>Create category</Button>
      </header>
      {query.isPending ? (
        <ExpenseLoading />
      ) : query.error ? (
        <ExpenseError error={query.error} retry={() => void query.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.items.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        record.is_active
                          ? "bg-emerald-700 text-white"
                          : "bg-red-700 text-white"
                      }
                    >
                      {record.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Actions for ${record.name}`}
                          />
                        }
                      >
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        data-coms-ui="operational"
                        align="end"
                      >
                        <DropdownMenuItem onClick={() => setEditor({ record })}>
                          Rename category
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant={record.is_active ? "destructive" : "default"}
                          onClick={() => setStatus(record)}
                        >
                          {record.is_active
                            ? "Deactivate category"
                            : "Activate category"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!query.data.items.length && (
                <TableRow>
                  <TableCell colSpan={3}>
                    No categories yet. Create a category to begin recording
                    expenses.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {editor && (
        <ExpenseCategoryEditor
          record={editor.record}
          onClose={() => setEditor(null)}
        />
      )}
      {status && (
        <ExpenseCategoryStatus
          record={status}
          onClose={() => setStatus(null)}
        />
      )}
    </div>
  );
}
