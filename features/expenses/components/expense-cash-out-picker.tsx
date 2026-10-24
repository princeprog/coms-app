"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useExpenseCashOuts } from "../hooks/use-expenses";
import type { CashOut } from "../schemas/expense.schema";
import { expenseDate, pesos } from "../services/expense-format";
import { ExpenseField } from "./expense-form-controls";
import { ExpenseError, ExpenseLoading } from "./expense-feedback";
import { ExpensePagination } from "./expense-pagination";

export function ExpenseCashOutPicker({
  branch,
  selected,
  selectedAmount,
  onSelect,
  disabled,
}: {
  branch: string;
  selected: string | null;
  selectedAmount: string;
  onSelect: (item: CashOut | null) => void;
  disabled: boolean;
}) {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setApplied(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  const result = useExpenseCashOuts(branch, applied, page, true);
  return (
    <section
      aria-label="Choose an existing cash out"
      className="space-y-3 rounded-lg border p-3"
    >
      <p className="text-sm font-medium">Existing register cash out</p>
      <p className="text-xs text-muted-foreground">
        Link the full amount of one cash out. This records an expense without
        removing register cash again.
      </p>
      {selected && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span>Selected cash out · {pesos(selectedAmount)}</span>
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            onClick={() => onSelect(null)}
          >
            Change selection
          </Button>
        </div>
      )}
      {!selected && (
        <>
          <ExpenseField
            id="cash-out-search"
            label="Find cash out"
            placeholder="Search reason or shift"
            value={search}
            disabled={disabled}
            maxLength={160}
            onChange={(event) => setSearch(event.target.value)}
          />
          {result.isPending ? (
            <ExpenseLoading />
          ) : result.error ? (
            <ExpenseError
              error={result.error}
              retry={() => void result.refetch()}
            />
          ) : (
            <>
              <div className="max-h-52 space-y-2 overflow-auto">
                {result.data.items.length ? (
                  result.data.items.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant="outline"
                      className="h-auto w-full justify-between gap-3 py-3 text-left whitespace-normal"
                      disabled={disabled}
                      onClick={() => onSelect(item)}
                    >
                      <span>
                        <span className="block">{item.reason}</span>
                        <span className="block text-xs text-muted-foreground">
                          Shift {item.shift_number} ·{" "}
                          {expenseDate(item.business_date)} ·{" "}
                          {item.actor_name ?? "Staff"}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {pesos(item.amount)}
                      </span>
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No matching cash outs. Use the existing Cash out action on
                    your register first, then refresh this list. Only unlinked
                    cash outs you may access appear here.
                  </p>
                )}
              </div>
              <ExpensePagination
                page={page}
                pageSize={10}
                total={result.data.total}
                pending={result.isFetching}
                onPage={setPage}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => void result.refetch()}
              >
                Refresh cash outs
              </Button>
            </>
          )}
        </>
      )}
    </section>
  );
}
