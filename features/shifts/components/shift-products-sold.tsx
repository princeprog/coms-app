"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ShiftReport } from "../schemas/shift.schema";
import { formatPeso } from "../services/shift-money";
import { ShiftReportCard, ShiftReportEmpty } from "./shift-report-card";

const PREVIEW_COUNT = 8;
const edge = "pl-5 sm:pl-6";
const end = "pr-5 sm:pr-6";

export function ShiftProductsSold({ shift }: { shift: ShiftReport }) {
  const [expanded, setExpanded] = useState(false);
  const sales = shift.sales_summary;
  const products = shift.products;
  const rows = expanded ? products : products.slice(0, PREVIEW_COUNT);
  return (
    <ShiftReportCard
      id="shift-products-heading"
      title="Products sold"
      aside={
        products.length > 0 && (
          <Badge
            variant="secondary"
            className="min-h-6 rounded-md text-sm tabular-nums"
            aria-label={`${products.length} products`}
          >
            {products.length}
          </Badge>
        )
      }
    >
      {!sales ? (
        <ShiftReportEmpty>
          Products are shown after you count the drawer.
        </ShiftReportEmpty>
      ) : products.length === 0 ? (
        <ShiftReportEmpty>No completed sales in this shift.</ShiftReportEmpty>
      ) : (
        <>
          <Table
            aria-labelledby="shift-products-heading"
            containerProps={{
              id: "shift-products-table",
              className: "border-t",
            }}
          >
            <TableHeader className="bg-muted/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className={edge}>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className={`text-right ${end}`}>Sales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((product) => (
                <TableRow key={product.product_id}>
                  <TableCell className={`${edge} py-2.5 whitespace-normal`}>
                    <span className="block font-medium wrap-anywhere">
                      {product.product_name}
                    </span>
                    {product.category_name && (
                      <span className="block text-xs text-muted-foreground">
                        {product.category_name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.quantity}
                  </TableCell>
                  <TableCell className={`text-right tabular-nums ${end}`}>
                    {formatPeso(product.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                <TableCell className={`${edge} font-semibold`}>Total</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {sales.items_sold}
                </TableCell>
                <TableCell
                  className={`text-right font-semibold tabular-nums ${end}`}
                >
                  {formatPeso(sales.net_amount)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          {products.length > PREVIEW_COUNT && (
            <div className="border-t px-3 py-2 sm:px-4">
              <Button
                variant="ghost"
                className="min-h-10"
                aria-expanded={expanded}
                aria-controls="shift-products-table"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded
                  ? "Show fewer"
                  : `Show all ${products.length} products`}
              </Button>
            </div>
          )}
        </>
      )}
    </ShiftReportCard>
  );
}
