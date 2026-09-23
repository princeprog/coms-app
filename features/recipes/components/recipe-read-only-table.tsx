import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RecipeIngredient } from "@/features/recipes/types/recipe.types";

export function RecipeReadOnlyTable({ items }: { items: RecipeIngredient[] }) {
  return (
    <Table aria-label="Saved recipe ingredients">
      <TableHeader>
        <TableRow>
          <TableHead>Stock item</TableHead>
          <TableHead>Quantity required</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.stock_item_id}>
            <TableCell className="font-medium">
              {item.stock_item_name}
            </TableCell>
            <TableCell className="tabular-nums">
              {item.quantity_required}
            </TableCell>
            <TableCell>{item.unit}</TableCell>
            <TableCell>
              {item.stock_item_is_active ? "Active" : "Inactive"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
