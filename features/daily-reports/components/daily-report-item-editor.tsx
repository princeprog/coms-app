"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { updateDailyReportSchema } from "@/features/daily-reports/schemas/daily-report.schema";
import type {
  DailyReport,
  DailyReportDraftItem,
  DailyReportItem,
  DailyReportUpdateAction,
} from "@/features/daily-reports/types/daily-report.types";
import {
  DailyReportCountViews,
  toDailyReportDraftItem,
} from "./daily-report-count-views";

export function DailyReportItemEditor({
  branchId,
  reportId,
  items,
  canEdit = true,
  action,
  onSaved,
  onDirtyChange,
}: {
  branchId: string;
  reportId: string;
  items: DailyReportItem[];
  canEdit?: boolean;
  action: DailyReportUpdateAction;
  onSaved: (report: DailyReport) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [savedItems, setSavedItems] = useState(() =>
    items.map(toDailyReportDraftItem),
  );
  const [draftItems, setDraftItems] = useState(() =>
    items.map(toDailyReportDraftItem),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(draftItems) !== JSON.stringify(savedItems);

  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

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

  function discardDraft() {
    setDraftItems(savedItems.map((item) => ({ ...item })));
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
      const nextSavedItems = result.report.items.map(toDailyReportDraftItem);
      setSavedItems(nextSavedItems);
      setDraftItems(nextSavedItems);
      onSaved(result.report);
    } catch {
      setError(
        "COMS could not save these counts. Your entries are still here.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="daily-report-counts-title" className="grid gap-4">
      <header className="grid gap-1">
        <h3 id="daily-report-counts-title" className="text-base font-semibold">
          Stock counts
        </h3>
        <p className="text-sm text-muted-foreground">
          Expected closing and variance are calculated by COMS from posted
          inventory movements.
        </p>
      </header>
      {dirty && canEdit && (
        <p
          role="status"
          className="rounded-md border border-orange-300/60 bg-orange-50/60 p-3 text-sm text-foreground dark:bg-orange-950/20"
        >
          Unsaved count edits. Expected closing and variance show the last saved
          values. Save or discard these edits before changing report status.
        </p>
      )}
      {canEdit ? (
        <form
          onSubmit={saveReport}
          aria-label="Edit daily report counts"
          className="grid gap-4"
        >
          <DailyReportCountViews
            items={items}
            drafts={draftItems}
            editable
            pending={pending}
            onChange={updateItem}
          />
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Save sends the complete count set. COMS recalculates expected
              closing and variance.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {dirty && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={discardDraft}
                >
                  Discard unsaved counts
                </Button>
              )}
              <Button type="submit" disabled={pending || items.length === 0}>
                {pending ? "Saving…" : "Save counts"}
              </Button>
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
      ) : (
        <DailyReportCountViews
          items={items}
          drafts={draftItems}
          editable={false}
          pending={false}
          onChange={updateItem}
        />
      )}
    </section>
  );
}
