"use client";
import { ExpenseError } from "@/features/expenses/components/expense-feedback";
export default function ErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <ExpenseError
      error={new Error("Expenses could not load. Try again.")}
      retry={reset}
    />
  );
}
