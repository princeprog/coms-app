import { format, parseISO } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SupplierReceiptPage } from "@/features/supplier-receipts/types/supplier-receipt.types";
import { SupplierReceiptRowActions } from "./supplier-receipt-row-actions";

const recordedDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Manila",
});
const recordedTime = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Manila",
});

function formatCost(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.padEnd(2, "0")}`;
}

export function SupplierReceiptTable({ page }: { page: SupplierReceiptPage }) {
  return (
    <Table
      aria-label="Supplier deliveries"
      containerProps={{
        role: "region",
        "aria-label": "Supplier deliveries table",
        tabIndex: 0,
        className:
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
      }}
    >
      <TableHeader className="bg-muted/40">
        <TableRow>
          <TableHead className="w-1/3 pl-4 sm:pl-5">Supplier</TableHead>
          <TableHead className="hidden sm:table-cell">Delivery date</TableHead>
          <TableHead className="text-right">Items</TableHead>
          <TableHead className="text-right">Total cost</TableHead>
          <TableHead className="hidden lg:table-cell">Recorded (PHT)</TableHead>
          <TableHead className="pr-4 text-right sm:pr-5">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {page.items.map((receipt) => (
          <TableRow key={receipt.id} className="focus-within:bg-muted/30">
            <TableCell className="min-w-40 py-3.5 pl-4 whitespace-normal sm:pl-5">
              <span className="font-medium break-words">
                {receipt.supplier_name}
              </span>
              <time
                dateTime={receipt.received_at}
                className="mt-1 block text-xs text-muted-foreground sm:hidden"
              >
                {format(parseISO(receipt.received_at), "PP")}
              </time>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <time dateTime={receipt.received_at}>
                {format(parseISO(receipt.received_at), "PP")}
              </time>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {receipt.item_count}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCost(receipt.total_cost)}
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <time dateTime={receipt.recorded_at} className="block">
                {recordedDate.format(new Date(receipt.recorded_at))}
              </time>
              <span className="text-xs text-muted-foreground">
                {recordedTime.format(new Date(receipt.recorded_at))}
              </span>
              <span className="block text-xs text-muted-foreground">
                {receipt.recorded_by_name}
              </span>
            </TableCell>
            <TableCell className="pr-4 text-right sm:pr-5">
              <SupplierReceiptRowActions
                id={receipt.id}
                supplierName={receipt.supplier_name}
                deliveryDate={receipt.received_at}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
