import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Dispatch, DispatchItem } from "../types/dispatch.types";

type Column = {
  label: string;
  value: (item: DispatchItem) => string;
  emphasis?: boolean;
  wideOnly?: boolean;
};

function signed(value: string | null | undefined) {
  if (!value) return "—";
  if (!/[1-9]/.test(value)) return "0";
  return value.startsWith("-") ? `−${value.slice(1)}` : `+${value}`;
}

function columnsFor(dispatch: Dispatch): {
  columns: Column[];
  caption?: string;
} {
  if (dispatch.status === "DRAFT")
    return {
      columns: [
        {
          label: "Planned quantity",
          value: (item) => item.quantity_dispatched ?? "—",
        },
      ],
    };
  if (dispatch.items.some((item) => item.quantity_dispatched === null))
    return {
      columns: [{ label: "Sent", value: () => "Hidden until counted" }],
    };
  if (dispatch.counted_at)
    return {
      caption: "Difference = counted − sent.",
      columns: [
        {
          label: "Sent",
          value: (item) => item.quantity_dispatched ?? "—",
          wideOnly: true,
        },
        { label: "Counted", value: (item) => item.quantity_received },
        {
          label: "Difference",
          value: (item) => signed(item.quantity_variance),
          emphasis: true,
        },
        {
          label: "Unresolved",
          value: (item) => item.quantity_outstanding?.replace(/^-/, "") ?? "—",
          wideOnly: true,
        },
      ],
    };
  return {
    columns: [
      { label: "Sent", value: (item) => item.quantity_dispatched ?? "—" },
      {
        label: "Received",
        value: (item) => item.quantity_received,
        wideOnly: true,
      },
      {
        label: "Awaiting count",
        value: (item) => item.quantity_in_transit ?? "—",
        emphasis: true,
      },
    ],
  };
}

export function DispatchItemTable({ dispatch }: { dispatch: Dispatch }) {
  const { columns, caption } = columnsFor(dispatch);
  return (
    <Table
      aria-label="Dispatch items"
      className="text-base"
      containerProps={{
        role: "region",
        "aria-label": "Dispatch quantities table",
        tabIndex: 0,
        className:
          "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
      }}
    >
      {caption && (
        <TableCaption className="mt-0 px-6 pt-2 pb-4 text-left text-sm sm:px-7">
          {caption}
        </TableCaption>
      )}
      <TableHeader className="bg-muted/40 [&_th]:h-12 [&_th]:text-sm [&_th]:font-medium [&_th]:text-muted-foreground">
        <TableRow>
          <TableHead scope="col" className="pl-6 sm:pl-7">
            Stock item
          </TableHead>
          <TableHead scope="col" className="hidden sm:table-cell">
            Unit
          </TableHead>
          {columns.map((column) => (
            <TableHead
              key={column.label}
              scope="col"
              className={cn(
                "pr-6 text-right sm:pr-7",
                column.wideOnly && "hidden sm:table-cell",
              )}
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {dispatch.items.map((item) => (
          <TableRow key={item.id} className="hover:bg-transparent">
            <TableCell className="min-w-28 max-w-48 py-6 pl-6 align-top whitespace-normal sm:pl-7">
              <span className="font-medium wrap-anywhere">
                {item.stock_item_name}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground sm:hidden">
                {item.unit}
              </span>
            </TableCell>
            <TableCell className="hidden py-6 align-top text-muted-foreground sm:table-cell">
              {item.unit}
            </TableCell>
            {columns.map((column) => (
              <TableCell
                key={column.label}
                className={cn(
                  "py-6 pr-6 text-right align-top tabular-nums sm:pr-7",
                  column.emphasis && "font-medium",
                  column.wideOnly && "hidden sm:table-cell",
                )}
              >
                {column.value(item)}
              </TableCell>
            ))}
          </TableRow>
        ))}
        {dispatch.items.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={columns.length + 2}
              className="py-6 text-center text-muted-foreground"
            >
              No stock items.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
