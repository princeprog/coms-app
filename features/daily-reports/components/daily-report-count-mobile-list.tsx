import type {
  DailyReportDraftItem,
  DailyReportItem,
} from "@/features/daily-reports/types/daily-report.types";
import { DailyReportCountDetails } from "./daily-report-count-details";
import { DailyReportDecimalField } from "./daily-report-input-field";

export function DailyReportCountMobileList({
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
    <div className="grid gap-3 lg:hidden" aria-label="Stock count items">
      {items.map((item) => {
        const values = drafts.find(
          (draft) => draft.stock_item_id === item.stock_item_id,
        );
        if (!values) return null;
        return (
          <article
            key={item.id}
            className="grid gap-4 rounded-lg border bg-card p-4"
          >
            <header>
              <h4 className="font-medium">{item.stock_item_name}</h4>
              <p className="text-xs text-muted-foreground">Unit: {item.unit}</p>
            </header>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Metric
                label="Opening quantity"
                value={item.opening_quantity}
                unit={item.unit}
              />
              <Metric
                label="Received"
                value={item.receipt_quantity}
                unit={item.unit}
              />
              <Metric
                label="Sales usage"
                value={item.sale_consumption_quantity}
                unit={item.unit}
              />
              <Metric
                label="Expected remaining"
                value={item.expected_closing_quantity}
                unit={item.unit}
              />
              <Metric
                label="Variance"
                value={item.variance_quantity}
                unit={item.unit}
              />
            </dl>
            {editable ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <DailyReportDecimalField
                  id={`mobile-physical-${item.stock_item_id}`}
                  label={`Physical closing for ${item.stock_item_name} (${item.unit})`}
                  value={values.physical_closing_quantity}
                  disabled={pending}
                  onChange={(value) =>
                    onChange(
                      item.stock_item_id,
                      "physical_closing_quantity",
                      value,
                    )
                  }
                />
                <DailyReportDecimalField
                  id={`mobile-waste-${item.stock_item_id}`}
                  label={`Waste for ${item.stock_item_name} (${item.unit})`}
                  value={values.waste_quantity}
                  disabled={pending}
                  onChange={(value) =>
                    onChange(item.stock_item_id, "waste_quantity", value)
                  }
                />
                <DailyReportDecimalField
                  id={`mobile-adjustment-${item.stock_item_id}`}
                  label={`Justified adjustment for ${item.stock_item_name} (${item.unit})`}
                  value={values.adjustment_quantity}
                  disabled={pending}
                  signed
                  onChange={(value) =>
                    onChange(item.stock_item_id, "adjustment_quantity", value)
                  }
                />
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Metric
                  label="Physical closing"
                  value={item.physical_closing_quantity}
                  unit={item.unit}
                />
                <Metric
                  label="Waste"
                  value={item.waste_quantity}
                  unit={item.unit}
                />
                <Metric
                  label="Justified adjustment"
                  value={item.adjustment_quantity}
                  unit={item.unit}
                />
              </dl>
            )}
            <DailyReportCountDetails
              item={item}
              values={values}
              editable={editable}
              pending={pending}
              idSuffix="mobile"
              onChange={onChange}
            />
          </article>
        );
      })}
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | null;
  unit: string;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium tabular-nums">
        {value === null ? "Not counted" : `${value} ${unit}`}
      </dd>
    </div>
  );
}
