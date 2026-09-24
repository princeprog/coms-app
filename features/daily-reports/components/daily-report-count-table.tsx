import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  DailyReportDraftItem,
  DailyReportItem,
} from "@/features/daily-reports/types/daily-report.types";
import { DailyReportCountDetails } from "./daily-report-count-details";
import { DailyReportDecimalField } from "./daily-report-input-field";

export function DailyReportCountTable({
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
    <div className="hidden lg:block">
      <Table
        className="min-w-[76rem]"
        containerProps={{
          role: "region",
          "aria-label": "Stock count table",
          tabIndex: 0,
          className:
            "rounded-lg border bg-card focus-within:ring-2 focus-within:ring-ring",
        }}
      >
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead scope="col" className="w-64">
              Stock item
            </TableHead>
            <TableHead scope="col" className="text-right">
              Expected closing
            </TableHead>
            <TableHead scope="col" className="text-right">
              Physical count
            </TableHead>
            <TableHead scope="col" className="text-right">
              Waste
            </TableHead>
            <TableHead scope="col" className="text-right">
              Justified adjustment
            </TableHead>
            <TableHead scope="col" className="text-right">
              Variance
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const values = drafts.find(
              (draft) => draft.stock_item_id === item.stock_item_id,
            );
            if (!values) return null;
            return (
              <TableRow key={item.id}>
                <TableCell className="whitespace-normal font-medium">
                  <p>{item.stock_item_name}</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    Unit: {item.unit}
                  </p>
                  <DailyReportCountDetails
                    item={item}
                    values={values}
                    editable={editable}
                    pending={pending}
                    idSuffix="desktop"
                    onChange={onChange}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatQuantity(item.expected_closing_quantity, item.unit)}
                </TableCell>
                <TableCell className="min-w-44 text-right tabular-nums">
                  {editable ? (
                    <DailyReportDecimalField
                      id={`desktop-physical-${item.stock_item_id}`}
                      label={`Physical closing for ${item.stock_item_name} (${item.unit})`}
                      labelClassName="sr-only"
                      className="flex flex-col gap-2"
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
                  ) : (
                    formatQuantity(item.physical_closing_quantity, item.unit)
                  )}
                </TableCell>
                <TableCell className="min-w-36 text-right tabular-nums">
                  {editable ? (
                    <DailyReportDecimalField
                      id={`desktop-waste-${item.stock_item_id}`}
                      label={`Waste for ${item.stock_item_name} (${item.unit})`}
                      labelClassName="sr-only"
                      className="flex flex-col gap-2"
                      value={values.waste_quantity}
                      disabled={pending}
                      onChange={(value) =>
                        onChange(item.stock_item_id, "waste_quantity", value)
                      }
                    />
                  ) : (
                    formatQuantity(item.waste_quantity, item.unit)
                  )}
                </TableCell>
                <TableCell className="min-w-44 text-right tabular-nums">
                  {editable ? (
                    <DailyReportDecimalField
                      id={`desktop-adjustment-${item.stock_item_id}`}
                      label={`Justified adjustment for ${item.stock_item_name} (${item.unit})`}
                      labelClassName="sr-only"
                      className="flex flex-col gap-2"
                      value={values.adjustment_quantity}
                      disabled={pending}
                      signed
                      onChange={(value) =>
                        onChange(
                          item.stock_item_id,
                          "adjustment_quantity",
                          value,
                        )
                      }
                    />
                  ) : (
                    formatQuantity(item.adjustment_quantity, item.unit)
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatQuantity(item.variance_quantity, item.unit)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function formatQuantity(value: string | null, unit: string) {
  return value === null ? "Not counted" : `${value} ${unit}`;
}
