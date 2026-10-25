"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Settings2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { hasPermission } from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";
import { ExportCsvButton } from "@/features/exports/components/export-csv-button";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { useDirectoryQuery } from "@/hooks/use-directory-query";
import { useExpensePageClamp } from "../hooks/use-expense-page-clamp";
import {
  useExpenseCategories,
  useExpenseLocations,
  useExpenses,
} from "../hooks/use-expenses";
import { expenseHref, type ExpenseQuery } from "../services/expense-query";
import { ExpenseFilters } from "./expense-filters";
import { ExpenseSummary } from "./expense-summary";
import { ExpenseTable, type ExpenseSelection } from "./expense-table";
import { ExpensePagination } from "./expense-pagination";
import { ExpenseEditor } from "./expense-editor";
import { ExpenseRecordDialog } from "./expense-record-dialog";
import { ExpenseError, ExpenseLoading } from "./expense-feedback";

export function ExpensesWorkspace({
  user,
  query,
}: {
  user: User;
  query: ExpenseQuery;
}) {
  const list = useExpenses(query);
  const locations = useExpenseLocations();
  const categories = useExpenseCategories();
  const directory = useDirectoryQuery(query, expenseHref);
  useExpensePageClamp(
    query,
    list.data,
    !list.isFetching && !list.isError,
    directory,
  );
  const [creating, setCreating] = useState(false);
  const [selection, setSelection] = useState<ExpenseSelection | null>(null);
  const can = (permission: string) => hasPermission(user, permission);
  // Branch-only users see their assigned branch, so location filtering adds nothing.
  const showLocation =
    can("expenses.commissary_read") || can("expenses.global_read");
  const exportParams = Object.fromEntries(
    Object.entries(query)
      .filter(([key]) => key !== "page" && key !== "page_size")
      .map(([key, value]) => [
        key,
        value === undefined ? undefined : String(value),
      ]),
  );
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operating expenses and stock purchases.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can("expenses.categories_manage") && (
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/expenses/categories"
            >
              <Settings2 aria-hidden="true" className="text-pink-600" />
              Manage categories
            </Link>
          )}
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh expenses"
            disabled={list.isFetching}
            onClick={() => void list.refetch()}
          >
            <RefreshCw
              aria-hidden="true"
              className={list.isFetching ? "animate-spin" : undefined}
            />
          </Button>
          <ExportCsvButton
            kind="expenses"
            params={exportParams}
            label="Export matching CSV"
          />
          {can("expenses.create") && (
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" />
              Record expense
            </Button>
          )}
        </div>
      </header>
      {locations.error && (
        <ExpenseError
          error={locations.error}
          retry={() => void locations.refetch()}
        />
      )}
      {categories.error && (
        <ExpenseError
          error={categories.error}
          retry={() => void categories.refetch()}
        />
      )}
      <ExpenseFilters
        directory={directory}
        query={query}
        locations={locations.data?.items ?? []}
        categories={categories.data?.items ?? []}
        showLocation={showLocation}
      />
      <div
        aria-busy={list.isFetching || directory.pending}
        className="space-y-4"
      >
        {list.isPending ? (
          <ExpenseLoading />
        ) : list.error ? (
          <ExpenseError error={list.error} retry={() => void list.refetch()} />
        ) : (
          <>
            <ExpenseSummary data={list.data} showLocations={showLocation} />
            {list.data.items.length ? (
              <ExpenseTable
                items={list.data.items}
                canEdit={can("expenses.update")}
                canVoid={can("expenses.void")}
                onSelect={setSelection}
              />
            ) : (
              <OperationalEmptyState
                title="No expenses in this selection"
                description="Try another date range or clear the location, source and category filters."
              />
            )}
            <ExpensePagination
              page={list.data.page}
              pageSize={list.data.page_size}
              total={list.data.total}
              pending={directory.pending}
              onPage={(page) => directory.apply({ page }, { resetPage: false })}
              onPageSize={(page_size) => directory.apply({ page_size })}
            />
          </>
        )}
      </div>
      {creating && (
        <ExpenseEditor
          canReadShifts={can("shifts.read")}
          onClose={() => setCreating(false)}
        />
      )}
      {selection && (
        <ExpenseRecordDialog
          key={`${selection.record.source}:${selection.record.id}:${selection.mode}`}
          selection={selection}
          canReadShifts={can("shifts.read")}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  );
}
