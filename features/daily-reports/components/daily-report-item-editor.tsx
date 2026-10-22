"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { updateDailyReportSchema } from "@/features/daily-reports/schemas/daily-report.schema";
import type {
  DailyReport,
  DailyReportItem,
  DailyReportDraftItem,
  DailyReportUpdateAction,
} from "@/features/daily-reports/types/daily-report.types";
import { countSetError } from "../services/daily-report-count-validation";
import { isNonZeroQuantity } from "../services/daily-report-quantity";
import {
  DailyReportCountToolbar,
  type CountFilter,
} from "./daily-report-count-toolbar";
import {
  DailyReportCountViews,
  toDailyReportDraftItem,
} from "./daily-report-count-views";
import { DailyReportCountSaveBar } from "./daily-report-count-save-bar";
import styles from "./daily-report-counts.module.css";

const emptyMessages: Record<CountFilter, string> = {
  all: "No stock items in this report.",
  todo: "Every item has a saved count.",
  variance: "No items differ from the expected count.",
};

const hasVariance = (item: DailyReportItem) =>
  item.variance_quantity !== null && isNonZeroQuantity(item.variance_quantity);

/** Focuses the first invalid field that is visible in the current layout. */
function focusFirstVisibleInvalid(form: HTMLFormElement) {
  requestAnimationFrame(() =>
    Array.from(form.querySelectorAll<HTMLElement>('[aria-invalid="true"]'))
      .find((field) => field.offsetParent !== null)
      ?.focus(),
  );
}

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
  const [filter, setFilter] = useState<CountFilter>("all");
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(draftItems) !== JSON.stringify(savedItems);

  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  // Filters use saved values so a row does not disappear while it is being typed in.
  const counts = useMemo(
    () => ({
      all: items.length,
      todo: items.filter((item) => item.physical_closing_quantity === null)
        .length,
      variance: items.filter(hasVariance).length,
    }),
    [items],
  );
  const visibleItems = items.filter((item) =>
    filter === "todo"
      ? item.physical_closing_quantity === null
      : filter === "variance"
        ? hasVariance(item)
        : true,
  );
  const counted = draftItems.filter(
    (draft) => draft.physical_closing_quantity !== "",
  ).length;

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
    setAttempted(false);
    setError("");
  }

  async function saveReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setAttempted(true);
    const problem = countSetError(draftItems);
    const parsed = updateDailyReportSchema.safeParse({ items: draftItems });
    if (problem || !parsed.success) {
      setError(
        problem ??
          parsed.error?.issues[0]?.message ??
          "Check the counts and try again.",
      );
      if (problem) setFilter("all");
      focusFirstVisibleInvalid(form);
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
      setAttempted(false);
      onSaved(result.report);
    } catch {
      setError(
        "COMS could not save these counts. Your entries are still here.",
      );
    } finally {
      setPending(false);
    }
  }

  const views = (
    <>
      <DailyReportCountToolbar
        filter={filter}
        counts={counts}
        editable={canEdit}
        counted={counted}
        total={items.length}
        onFilter={setFilter}
      />
      {visibleItems.length ? (
        <DailyReportCountViews
          items={visibleItems}
          drafts={draftItems}
          saved={savedItems}
          editable={canEdit}
          pending={pending}
          attempted={attempted}
          onChange={updateItem}
        />
      ) : (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          {emptyMessages[filter]}
        </p>
      )}
    </>
  );

  return (
    <section
      aria-labelledby="daily-report-counts-title"
      className={cn(styles.page, "overflow-clip rounded-xl border bg-card")}
    >
      <header className="flex flex-col gap-1 px-5 pt-4 pb-3">
        <h3 id="daily-report-counts-title" className="text-base font-semibold">
          Stock counts
        </h3>
        <p className="text-sm text-muted-foreground">
          Expected quantities come from posted inventory movements.
        </p>
      </header>
      {canEdit ? (
        <form
          onSubmit={saveReport}
          noValidate
          aria-label="Edit daily report counts"
        >
          {views}
          <DailyReportCountSaveBar
            dirty={dirty}
            pending={pending}
            disabled={pending || items.length === 0}
            error={error}
            onDiscard={discardDraft}
          />
        </form>
      ) : (
        views
      )}
    </section>
  );
}
