import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RecipeLine } from "../../schemas/product-recipe.schema";
import { RecipeScopeLabel } from "./recipe-scope-options";

export function ProductRecipeTable({ recipe }: { recipe: RecipeLine[] }) {
  return (
    <section
      aria-labelledby="product-recipe-heading"
      className="flex flex-col gap-3"
    >
      <h2 id="product-recipe-heading" className="text-xl font-semibold">
        Recipe
      </h2>
      {recipe.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No recipe. Sales of this product don&apos;t deduct stock.
        </p>
      ) : (
        <Table
          aria-labelledby="product-recipe-heading"
          containerProps={{
            role: "region",
            "aria-label": "Recipe table",
            tabIndex: 0,
          }}
        >
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Stock item</TableHead>
              <TableHead scope="col" className="text-right">
                Quantity per sale
              </TableHead>
              <TableHead scope="col">Applies to</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipe.map((line) => (
              <TableRow key={line.stock_item_id + line.usage_scope}>
                <TableCell className="font-medium whitespace-normal">
                  {line.stock_item_name}
                  {!line.is_active && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Inactive)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {line.quantity} {line.unit}
                </TableCell>
                <TableCell>
                  <RecipeScopeLabel scope={line.usage_scope} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
