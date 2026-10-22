import type {
  DailyReportDraftItem,
  DailyReportItem,
} from "@/features/daily-reports/types/daily-report.types";
import { DailyReportCountMobileList } from "./daily-report-count-mobile-list";
import { DailyReportCountTable } from "./daily-report-count-table";

export type CountChange = (
  stockItemId: string,
  field: keyof DailyReportDraftItem,
  value: string,
) => void;

export type CountViewProps = {
  items: DailyReportItem[];
  drafts: DailyReportDraftItem[];
  saved: DailyReportDraftItem[];
  editable: boolean;
  pending: boolean;
  attempted: boolean;
  onChange: CountChange;
};

/** Both layouts share one draft; CSS shows the table on wide screens and cards otherwise. */
export function DailyReportCountViews(props: CountViewProps) {
  return (
    <>
      <DailyReportCountTable {...props} />
      <DailyReportCountMobileList {...props} />
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

export function rowState(
  props: Pick<CountViewProps, "drafts" | "saved" | "editable">,
  item: DailyReportItem,
) {
  const values = props.drafts.find(
    (draft) => draft.stock_item_id === item.stock_item_id,
  );
  const saved = props.saved.find(
    (draft) => draft.stock_item_id === item.stock_item_id,
  );
  const changed =
    props.editable && JSON.stringify(values) !== JSON.stringify(saved);
  return { values, changed };
}
