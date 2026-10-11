import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ClipboardCheckIcon, InfoIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSupplierReceiptCost } from "../services/supplier-receipt-total";

export function SupplierReceiptCreateHeader({
  pending,
  disabled,
}: {
  pending: boolean;
  disabled: boolean;
}) {
  return (
    <header className="flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/receipts" />}>
              Supplier Receiving
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New delivery</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Record supplier delivery
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Record delivered stock and review the totals before updating
            commissary inventory.
          </p>
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <SupplierReceiptCancelLink pending={pending} />
          <Button type="submit" size="lg" disabled={pending || disabled}>
            <ClipboardCheckIcon />
            Review delivery
          </Button>
        </div>
      </div>
      <DeliveryProgress />
    </header>
  );
}

export function SupplierReceiptSummaryCard({
  supplierName,
  receivedAt,
  lineCount,
  total,
  pending,
  disabled,
}: {
  supplierName: string;
  receivedAt: string;
  lineCount: number;
  total: string | null;
  pending: boolean;
  disabled: boolean;
}) {
  return (
    <aside className="min-w-0 xl:col-span-1">
      <Card className="gap-0 py-0 xl:sticky xl:top-6">
        <CardHeader className="border-b py-5">
          <CardTitle>
            <h2 className="text-lg font-semibold">Delivery summary</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 py-5">
          <dl className="grid gap-4 text-sm">
            <SummaryField label="Supplier" value={supplierName} />
            <SummaryField
              label="Delivery date"
              value={formatDeliveryDate(receivedAt)}
            />
            <SummaryField label="Stock items" value={String(lineCount)} />
          </dl>
          <div className="flex items-end justify-between gap-4 border-t pt-5">
            <span className="font-semibold">Total cost</span>
            <span className="text-xl font-semibold tabular-nums">
              {total ? formatSupplierReceiptCost(total) : "—"}
            </span>
          </div>
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <InfoIcon className="mt-0.5 size-4 shrink-0" />
            <p>
              Recording this delivery immediately updates commissary inventory.
              Supplier delivery records cannot be edited after saving.
            </p>
          </div>
          <div className="grid gap-2">
            <Button type="submit" size="lg" disabled={pending || disabled}>
              <ClipboardCheckIcon />
              Review delivery
            </Button>
            <SupplierReceiptCancelLink pending={pending} />
          </div>
          <p className="text-xs text-muted-foreground">
            Your entries are preserved if recording fails.
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}

function DeliveryProgress() {
  return (
    <ol
      aria-label="Delivery progress"
      className="mx-auto flex w-full max-w-xl items-center gap-2 text-xs sm:gap-3 sm:text-sm"
    >
      <li
        aria-current="step"
        className="flex shrink-0 items-center gap-2 font-medium text-primary"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-8">
          1
        </span>
        <span className="sm:hidden">Details</span>
        <span className="hidden sm:inline">Delivery details</span>
      </li>
      <li aria-hidden="true" className="h-px min-w-4 flex-1 bg-border" />
      <li className="flex shrink-0 items-center gap-2 text-muted-foreground">
        <span className="flex size-7 items-center justify-center rounded-full bg-muted font-medium text-foreground sm:size-8">
          2
        </span>
        <span className="sm:hidden">Review</span>
        <span className="hidden sm:inline">Review &amp; record</span>
      </li>
    </ol>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium sm:text-right xl:text-left 2xl:text-right">
        {value}
      </dd>
    </div>
  );
}

function SupplierReceiptCancelLink({ pending }: { pending: boolean }) {
  return (
    <Link
      href="/receipts"
      aria-disabled={pending}
      tabIndex={pending ? -1 : undefined}
      onClick={(event) => {
        if (pending) event.preventDefault();
      }}
      className={buttonVariants({ variant: "outline", size: "lg" })}
    >
      Cancel
    </Link>
  );
}

function formatDeliveryDate(value: string) {
  if (!value) return "Select delivery date";
  try {
    return format(parseISO(value), "PP");
  } catch {
    return value;
  }
}
