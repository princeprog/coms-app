"use client";
import { Button } from "@/components/ui/button";
import { ExpenseSelect } from "./expense-form-controls";
export function ExpensePagination({
  page,
  pageSize,
  total,
  pending,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  pending?: boolean;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
}) {
  const count = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav
      aria-label="Expense pagination"
      className="flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <p aria-live="polite">
        {total
          ? `${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} of ${total}`
          : "0 results"}{" "}
        · Page {page} of {count}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSize && (
          <div className="w-32">
            <ExpenseSelect
              id="expense-page-size"
              label="Rows per page"
              value={String(pageSize)}
              options={[10, 30, 50].map((size) => ({
                value: String(size),
                label: String(size),
              }))}
              onChange={(value) => onPageSize(Number(value))}
            />
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={pending || page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pending || page >= count}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
