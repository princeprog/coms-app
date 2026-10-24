"use client";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ExpenseDetail as Detail } from "../schemas/expense.schema";
import {
  expenseDate,
  paymentLabels,
  pesos,
  sourceLabels,
} from "../services/expense-format";
import { ExpenseStatus } from "./expense-table";
import { ExpenseHistory } from "./expense-history";

export function ExpenseDetail({
  data,
  onClose,
}: {
  data: Detail;
  onClose: () => void;
}) {
  const record = data.record;
  const sourceHref =
    data.source_href?.startsWith("/") && !data.source_href.startsWith("//")
      ? data.source_href
      : null;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        data-coms-ui="operational"
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>{record.description}</DialogTitle>
          <DialogDescription>
            {sourceLabels[record.source]} · {expenseDate(record.expense_date)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-3">
          <p className="text-2xl font-semibold tabular-nums">
            {pesos(record.amount)}
          </p>
          <ExpenseStatus status={record.status} />
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {[
            ["Location", record.location_name],
            ["Category", record.category_name],
            [
              "Payment",
              record.payment_method
                ? paymentLabels[record.payment_method]
                : "Not specified",
            ],
            [
              "Cash source",
              record.cash_source === "REGISTER"
                ? "Linked register cash out"
                : record.cash_source === "OTHER"
                  ? "Other cash"
                  : "Not applicable",
            ],
            ["Payee", record.payee ?? "Not specified"],
            ["Reference", record.reference ?? "Not specified"],
            ["Recorded by", record.created_by_name ?? "Not specified"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-1 break-words font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        {record.notes && (
          <div className="text-sm">
            <p className="text-muted-foreground">Notes</p>
            <p className="mt-1 whitespace-pre-wrap">{record.notes}</p>
          </div>
        )}
        {record.source !== "OPERATING" && (
          <p className="rounded-lg bg-muted p-3 text-sm">
            This stock purchase is included once at its purchase value. Manage
            its source record to view the original purchase.
          </p>
        )}
        <ExpenseHistory history={data.history} />
        <DialogFooter>
          {sourceHref && (
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={sourceHref}
            >
              View source purchase
            </Link>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
