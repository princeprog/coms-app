"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateDailyReportSchema } from "@/features/daily-reports/schemas/daily-report.schema";
import type {
  DailyReport,
  DailyReportDraftItem,
  DailyReportItem,
  DailyReportUpdateAction,
} from "@/features/daily-reports/types/daily-report.types";
import { DailyReportCountCard } from "./daily-report-count-card";

export function DailyReportItemEditor({
  branchId,
  reportId,
  items,
  canEdit = true,
  action,
  onSaved,
}: {
  branchId: string;
  reportId: string;
  items: DailyReportItem[];
  canEdit?: boolean;
  action: DailyReportUpdateAction;
  onSaved: (report: DailyReport) => void;
}) {
  const [draftItems, setDraftItems] = useState(() => items.map(toDraftItem));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function updateItem(
    stockItemId: string,
    field: keyof DailyReportDraftItem,
    value: string,
  ) {
    setDraftItems((current) =>
      current.map((item) =>
        item.stock_item_id === stockItemId ? { ...item, [field]: value } : item,
      ),
    );
    setError("");
  }

  async function saveReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = updateDailyReportSchema.safeParse({ items: draftItems });
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ??
          "Enter every physical count and explain nonzero waste or adjustments.",
      );
      return;
    }

    setPending(true);
    setError("");
    try {
      const result = await action(branchId, reportId, parsed.data);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraftItems(result.report.items.map(toDraftItem));
      onSaved(result.report);
    } catch {
      setError(
        "COMS could not save these counts. Your entries are still here.",
      );
    } finally {
      setPending(false);
    }
  }

  const cards = (
    <div className="grid gap-4">
      {items.map((item) => {
        const values = draftItems.find(
          (draft) => draft.stock_item_id === item.stock_item_id,
        );
        if (!values) return null;
        return (
          <DailyReportCountCard
            key={item.id}
            item={item}
            values={values}
            editable={canEdit}
            pending={pending}
            onChange={updateItem}
          />
        );
      })}
    </div>
  );

  if (!canEdit) return cards;

  return (
    <form onSubmit={saveReport} aria-label="Edit daily report counts">
      {cards}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          COMS recalculates expected closing and variance when you save.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save report"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

function toDraftItem(item: DailyReportItem): DailyReportDraftItem {
  return {
    stock_item_id: item.stock_item_id,
    physical_closing_quantity: item.physical_closing_quantity ?? "",
    waste_quantity: item.waste_quantity,
    waste_reason: item.waste_reason ?? "",
    adjustment_quantity: item.adjustment_quantity,
    adjustment_reason: item.adjustment_reason ?? "",
  };
}
