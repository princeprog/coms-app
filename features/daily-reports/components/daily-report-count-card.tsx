"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DailyReportDraftItem,
  DailyReportItem,
} from "@/features/daily-reports/types/daily-report.types";
import { DailyReportMetric } from "./daily-report-metric";
import {
  DailyReportDecimalField,
  DailyReportReasonField,
} from "./daily-report-input-field";

export function DailyReportCountCard({
  item,
  values,
  editable,
  pending,
  onChange,
}: {
  item: DailyReportItem;
  values: DailyReportDraftItem;
  editable: boolean;
  pending: boolean;
  onChange: (
    stockItemId: string,
    field: keyof DailyReportDraftItem,
    value: string,
  ) => void;
}) {
  const id = item.stock_item_id;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.stock_item_name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 xl:grid-cols-5">
          <DailyReportMetric
            label="Opening"
            value={item.opening_quantity}
            unit={item.unit}
          />
          <DailyReportMetric
            label="Receipt quantities"
            value={item.receipt_quantity}
            unit={item.unit}
          />
          <DailyReportMetric
            label="Sale consumption"
            value={item.sale_consumption_quantity}
            unit={item.unit}
          />
          <DailyReportMetric
            label="Sale void returns"
            value={item.sale_void_reversal_quantity}
            unit={item.unit}
          />
          <DailyReportMetric
            label="Ledger adjustments"
            value={item.ledger_adjustment_quantity}
            unit={item.unit}
          />
          <DailyReportMetric
            label="Ledger closing"
            value={item.ledger_closing_quantity}
            unit={item.unit}
          />
          <DailyReportMetric
            label="Expected closing"
            value={item.expected_closing_quantity}
            unit={item.unit}
          />
          <DailyReportMetric
            label="Physical closing"
            value={item.physical_closing_quantity}
            unit={item.unit}
          />
          <DailyReportMetric
            label="Variance"
            value={item.variance_quantity}
            unit={item.unit}
          />
        </dl>
        {editable ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <DailyReportDecimalField
              id={`physical-${id}`}
              label={`Physical closing for ${item.stock_item_name} (${item.unit})`}
              value={values.physical_closing_quantity}
              disabled={pending}
              onChange={(value) =>
                onChange(id, "physical_closing_quantity", value)
              }
            />
            <DailyReportDecimalField
              id={`waste-${id}`}
              label={`Waste for ${item.stock_item_name} (${item.unit})`}
              value={values.waste_quantity}
              disabled={pending}
              onChange={(value) => onChange(id, "waste_quantity", value)}
            />
            <DailyReportReasonField
              id={`waste-reason-${id}`}
              label={`Reason for waste for ${item.stock_item_name}`}
              value={values.waste_reason}
              disabled={pending}
              onChange={(value) => onChange(id, "waste_reason", value)}
            />
            <DailyReportDecimalField
              id={`adjustment-${id}`}
              label={`Justified adjustment for ${item.stock_item_name} (${item.unit})`}
              value={values.adjustment_quantity}
              disabled={pending}
              onChange={(value) => onChange(id, "adjustment_quantity", value)}
              signed
            />
            <DailyReportReasonField
              id={`adjustment-reason-${id}`}
              label={`Reason for adjustment for ${item.stock_item_name}`}
              value={values.adjustment_reason}
              disabled={pending}
              onChange={(value) => onChange(id, "adjustment_reason", value)}
            />
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <DailyReportMetric
              label="Waste"
              value={item.waste_quantity}
              unit={item.unit}
            />
            <DailyReportMetric label="Waste reason" value={item.waste_reason} />
            <DailyReportMetric
              label="Justified adjustment"
              value={item.adjustment_quantity}
              unit={item.unit}
            />
            <DailyReportMetric
              label="Adjustment reason"
              value={item.adjustment_reason}
            />
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
