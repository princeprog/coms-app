import { formatProductPrice } from "@/lib/format-currency";
import type {
  CatalogRecord,
  CatalogDisplayColumn,
} from "../types/catalog.types";
import { CatalogRecordStatus } from "./catalog-record-status";
export function displayValue(
  record: CatalogRecord,
  key: string,
  missing = "—",
  labels?: Record<string, string>,
) {
  const value = record[key];
  if (Array.isArray(value))
    return (
      value.map((v) => labels?.[String(v)] ?? String(v)).join(", ") || missing
    );
  if (typeof value === "string" && labels) return labels[value] ?? value;
  return typeof value === "string" && value.trim() ? value : missing;
}

export function CatalogCellContent({
  record,
  column,
  columns,
  index,
  responsive,
}: {
  record: CatalogRecord;
  column: CatalogDisplayColumn;
  columns: CatalogDisplayColumn[];
  index: number;
  responsive: boolean;
}) {
  return (
    <>
      {" "}
      <span
        className={
          responsive
            ? column.key === "unit"
              ? "block"
              : "block wrap-anywhere"
            : "block truncate"
        }
        title={responsive ? undefined : displayValue(record, column.key)}
      >
        {column.format === "currency" && typeof record[column.key] === "string"
          ? formatProductPrice(record[column.key] as string)
          : displayValue(
              record,
              column.key,
              responsive ? "Not provided" : "—",
              column.valueLabels,
            )}
      </span>
      {responsive && index === 0 && (
        <div className="flex flex-col items-start gap-1">
          {columns
            .slice(1)
            .filter(
              (detail) =>
                detail.key !== "unit" && displayValue(record, detail.key, ""),
            )
            .map((detail) => (
              <span
                key={detail.key}
                className="text-xs font-normal text-muted-foreground wrap-anywhere lg:hidden"
              >
                {detail.key === "category" ? "" : `${detail.label}: `}
                {detail.format === "currency" &&
                typeof record[detail.key] === "string"
                  ? formatProductPrice(record[detail.key] as string)
                  : displayValue(record, detail.key, "—", detail.valueLabels)}
              </span>
            ))}
          {columns[0]?.key === "supplier_name" &&
            columns
              .slice(1)
              .every((detail) => !displayValue(record, detail.key, "")) && (
              <span className="text-xs font-normal text-muted-foreground lg:hidden">
                No contact details
              </span>
            )}
          <span className="md:hidden">
            <CatalogRecordStatus active={record.is_active} />
          </span>
        </div>
      )}
    </>
  );
}
