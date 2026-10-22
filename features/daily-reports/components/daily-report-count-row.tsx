"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  DailyReportDraftItem,
  DailyReportItem,
} from "../types/daily-report.types";
import { isNonZeroQuantity, withUnit } from "../services/daily-report-quantity";
import {
  DailyReportCountInput,
  type QuantityField,
} from "./daily-report-count-inputs";
import { DailyReportCountReasons } from "./daily-report-count-reasons";
import styles from "./daily-report-counts.module.css";
import type { CountViewProps } from "./daily-report-count-views";
import { DailyReportLedger } from "./daily-report-ledger";
import { DailyReportVariance } from "./daily-report-variance";

const COLUMNS = 7;

export function DailyReportCountRow({
  item,
  values,
  changed,
  editable,
  pending,
  attempted,
  onChange,
}: Omit<CountViewProps, "items" | "drafts" | "saved"> & {
  item: DailyReportItem;
  values: DailyReportDraftItem;
  changed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const detailsId = `count-ledger-${item.stock_item_id}`;
  const hasReasons = editable
    ? isNonZeroQuantity(values.waste_quantity) ||
      isNonZeroQuantity(values.adjustment_quantity)
    : Boolean(item.waste_reason || item.adjustment_reason);
  // Inputs are taller than text, so read-only values drop to the text baseline.
  const cell = cn(
    "text-right align-top tabular-nums",
    editable ? "py-3" : "py-3 pt-5",
  );
  const quantity = (field: QuantityField, saved: string | null) =>
    editable ? (
      <DailyReportCountInput
        item={item}
        values={values}
        field={field}
        pending={pending}
        attempted={attempted}
        idPrefix="desktop"
        showLabel={false}
        onChange={onChange}
      />
    ) : (
      (withUnit(saved, item.unit) ?? (
        <span className="text-muted-foreground">Not counted</span>
      ))
    );
  return (
    <TableBody className="border-b last:border-b-0">
      <TableRow className="border-0 hover:bg-transparent">
        <TableCell className="py-3 pl-5 align-top whitespace-normal">
          <p className="font-medium wrap-anywhere">{item.stock_item_name}</p>
          <p className="text-xs text-muted-foreground">{item.unit}</p>
        </TableCell>
        <TableCell className="py-3 pt-5 text-right align-top tabular-nums">
          {withUnit(item.expected_closing_quantity, item.unit)}
        </TableCell>
        <TableCell className={cn(cell, "w-40")}>
          {quantity(
            "physical_closing_quantity",
            item.physical_closing_quantity,
          )}
        </TableCell>
        <TableCell className={cn(cell, "w-32")}>
          {quantity("waste_quantity", item.waste_quantity)}
        </TableCell>
        <TableCell className={cn(cell, "w-36")}>
          {quantity("adjustment_quantity", item.adjustment_quantity)}
        </TableCell>
        <TableCell className="py-3 pt-5 text-right align-top">
          <DailyReportVariance
            value={item.variance_quantity}
            unit={item.unit}
            stale={changed}
          />
        </TableCell>
        <TableCell className="w-12 py-3 pt-4 pr-4 align-top">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-expanded={open}
            aria-controls={open ? detailsId : undefined}
            aria-label={`${open ? "Hide" : "Show"} stock movements for ${item.stock_item_name}`}
            onClick={() => setOpen((value) => !value)}
          >
            <ChevronDown
              aria-hidden="true"
              data-open={open}
              className={cn(styles.chevron, "size-4")}
            />
          </Button>
        </TableCell>
      </TableRow>
      {(hasReasons || open) && (
        <TableRow className="border-0 hover:bg-transparent">
          <TableCell
            colSpan={COLUMNS}
            className="px-5 pt-0 pb-4 whitespace-normal"
          >
            <div className="flex flex-col gap-3">
              {hasReasons && (
                <DailyReportCountReasons
                  item={item}
                  values={values}
                  editable={editable}
                  pending={pending}
                  attempted={attempted}
                  idPrefix="desktop"
                  onChange={onChange}
                />
              )}
              {open && (
                <div
                  id={detailsId}
                  className="rounded-lg bg-muted/40 px-4 py-3"
                >
                  <DailyReportLedger item={item} />
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}
