import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Dispatch } from "@/features/dispatches/types/dispatch.types";

export function DispatchItemTable({ dispatch }: { dispatch: Dispatch }) {
  return (
    <Table
      aria-label="Dispatch items"
      containerProps={{
        role: "region",
        "aria-label": "Dispatch quantities table",
        tabIndex: 0,
        className: "rounded-lg border",
      }}
    >
      <TableHeader>
        <TableRow>
          <TableHead>Stock item</TableHead>
          <TableHead className="text-right">Requested</TableHead>
          <TableHead className="text-right">Dispatched</TableHead>
          <TableHead className="text-right">Received</TableHead>
          <TableHead className="text-right">Shortage closed</TableHead>
          <TableHead className="text-right">In transit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dispatch.items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              {item.stock_item_name}
            </TableCell>
            <QuantityCell quantity={item.quantity_requested} unit={item.unit} />
            <QuantityCell
              quantity={item.quantity_dispatched}
              unit={item.unit}
            />
            <QuantityCell quantity={item.quantity_received} unit={item.unit} />
            <QuantityCell
              quantity={item.quantity_shortage_closed}
              unit={item.unit}
            />
            <QuantityCell
              quantity={item.quantity_in_transit}
              unit={item.unit}
            />
          </TableRow>
        ))}
        {dispatch.items.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={6}
              className="py-6 text-center text-muted-foreground"
            >
              This dispatch has no item lines.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function QuantityCell({ quantity, unit }: { quantity: string; unit: string }) {
  return (
    <TableCell className="text-right tabular-nums">
      {quantity} {unit}
    </TableCell>
  );
}
