"use client";

import Link from "next/link";
import { Eye, MoreHorizontal, Ban } from "lucide-react";
import { MenuStatusBadge } from "@/features/menus/components/menu-status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatProductPrice } from "@/lib/format-currency";
import type { SalePage, SaleListItem } from "../types/sale.types";
import {
  createSalesHref,
  type SalesPageFilters,
} from "../services/sales-page-params";
import { formatSaleTime } from "../services/sales-history-filters";

export function SalesHistoryTable({
  page,
  filters,
  onVoid,
}: {
  page: SalePage;
  filters: SalesPageFilters;
  onVoid?: (sale: SaleListItem) => void;
}) {
  return (
    <div
      role="region"
      aria-label="Sales history results"
      tabIndex={0}
      className="w-full overflow-x-auto rounded-xl border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Table aria-label="Sales history">
        <TableHeader className="bg-muted/60">
          <TableRow>
            <TableHead className="pl-4">Sale</TableHead>
            <TableHead>Cashier</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="pr-8 text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-32 text-center text-muted-foreground"
              >
                No sales match these filters.
              </TableCell>
            </TableRow>
          ) : (
            page.items.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="py-4 pl-4">
                  <div className="font-medium tabular-nums">
                    {sale.sale_reference ?? "Sale"}
                  </div>
                  <time
                    dateTime={sale.created_at}
                    className="text-xs text-muted-foreground"
                  >
                    {formatSaleTime(sale.created_at, true)} ·{" "}
                    {formatSaleTime(sale.created_at)}
                  </time>
                </TableCell>
                <TableCell
                  className="max-w-48 truncate"
                  title={sale.cashier_name}
                >
                  {sale.cashier_name}
                </TableCell>
                <TableCell>
                  {sale.service_type === "DINE_IN"
                    ? "Dine-in"
                    : sale.service_type === "TAKEAWAY"
                      ? "Takeout"
                      : "Not recorded"}
                </TableCell>
                <TableCell>{sale.tender_method}</TableCell>
                <TableCell className="pr-8 text-right font-medium tabular-nums">
                  {formatProductPrice(sale.total_amount)}
                </TableCell>
                <TableCell>
                  <MenuStatusBadge
                    status={sale.status === "COMPLETED" ? "active" : "inactive"}
                  >
                    {sale.status === "COMPLETED" ? "Completed" : "Voided"}
                  </MenuStatusBadge>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${sale.sale_reference ?? `sale by ${sale.cashier_name}`}`}
                        />
                      }
                    >
                      <MoreHorizontal aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          render={
                            <Link
                              href={createSalesHref({
                                ...filters,
                                saleId: sale.id,
                              })}
                            />
                          }
                        >
                          <Eye aria-hidden="true" />
                          View details
                        </DropdownMenuItem>
                        {onVoid && sale.status === "COMPLETED" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => onVoid(sale)}
                            >
                              <Ban aria-hidden="true" />
                              Void sale
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
