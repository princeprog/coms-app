import type {
  DailyReportDraftItem,
  DailyReportItem,
} from "@/features/daily-reports/types/daily-report.types";
import { DailyReportCountMobileList } from "./daily-report-count-mobile-list";
import { DailyReportCountTable } from "./daily-report-count-table";

export function DailyReportCountViews({
  items,
  drafts,
  editable,
  pending,
  onChange,
}: {
  items: DailyReportItem[];
  drafts: DailyReportDraftItem[];
  editable: boolean;
  pending: boolean;
  onChange: (
    stockItemId: string,
    field: keyof DailyReportDraftItem,
    value: string,
  ) => void;
}) {
  return (
    <>
      <DailyReportCountTable
        items={items}
        drafts={drafts}
        editable={editable}
        pending={pending}
        onChange={onChange}
      />
      <DailyReportCountMobileList
        items={items}
        drafts={drafts}
        editable={editable}
        pending={pending}
        onChange={onChange}
      />
    </>
  );
}

export function toDailyReportDraftItem(
  item: DailyReportItem,
): DailyReportDraftItem {
  return {
    stock_item_id: item.stock_item_id,
    physical_closing_quantity: item.physical_closing_quantity ?? "",
    waste_quantity: item.waste_quantity,
    waste_reason: item.waste_reason ?? "",
    adjustment_quantity: item.adjustment_quantity,
    adjustment_reason: item.adjustment_reason ?? "",
  };
}
