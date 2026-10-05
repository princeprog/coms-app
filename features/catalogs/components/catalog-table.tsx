import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CatalogRecordStatus } from "./catalog-record-status";
import { CatalogRowActions } from "@/features/catalogs/components/catalog-row-actions";
import type {
  CatalogDeactivateAction,
  CatalogDisplayColumn,
  CatalogRecord,
} from "@/features/catalogs/types/catalog.types";

function displayValue(record: CatalogRecord, key: string, missing = "—") {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : missing;
}

export function CatalogTable({
  title,
  pageItems,
  columns,
  canUpdate,
  canDeactivate,
  onView,
  onEdit,
  onDeactivated,
  deactivateAction,
  responsive = false,
}: {
  title: string;
  pageItems: CatalogRecord[];
  columns: CatalogDisplayColumn[];
  canUpdate: boolean;
  canDeactivate: boolean;
  onView: (record: CatalogRecord) => void;
  onEdit: (record: CatalogRecord) => void;
  onDeactivated: (record: CatalogRecord) => void;
  deactivateAction: CatalogDeactivateAction;
  responsive?: boolean;
}) {
  const secondaryClass = (key: string) =>
    responsive && key !== columns[0]?.key && key !== "unit"
      ? "hidden lg:table-cell"
      : undefined;
  return (
    <Table
      aria-label={title}
      className={responsive ? "min-w-80" : undefined}
      containerProps={
        responsive
          ? { role: "region", "aria-label": `${title} table`, tabIndex: 0 }
          : undefined
      }
    >
      {responsive && (
        <TableCaption className="sr-only">
          {title}, listed alphabetically by name. Open the row actions for full
          details or permitted changes.
        </TableCaption>
      )}
      <TableHeader className={responsive ? undefined : "bg-muted/40"}>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              scope="col"
              key={column.key}
              className={cn(
                secondaryClass(column.key),
                responsive && column.key === columns[0]?.key && "pl-4 sm:pl-5",
              )}
            >
              {column.label}
            </TableHead>
          ))}
          <TableHead
            scope="col"
            className={responsive ? "hidden md:table-cell" : undefined}
          >
            Status
          </TableHead>
          <TableHead
            scope="col"
            className={cn("text-right", responsive && "w-12 pr-4 sm:pr-5")}
          >
            <span className={responsive ? "sr-only" : undefined}>Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pageItems.map((record) => {
          const recordName = displayValue(record, columns[0]?.key ?? "id");
          return (
            <TableRow key={record.id}>
              {columns.map((column, index) => (
                <TableCell
                  key={column.key}
                  className={cn(
                    secondaryClass(column.key),
                    index === 0 ? "max-w-64 font-medium" : "max-w-56",
                    responsive && "py-3 whitespace-normal",
                    responsive && column.key === "unit" && "whitespace-nowrap",
                    responsive && index === 0 && "pl-4 sm:pl-5",
                  )}
                >
                  <span
                    className={
                      responsive
                        ? column.key === "unit"
                          ? "block"
                          : "block wrap-anywhere"
                        : "block truncate"
                    }
                    title={
                      responsive ? undefined : displayValue(record, column.key)
                    }
                  >
                    {displayValue(
                      record,
                      column.key,
                      responsive ? "Not provided" : "—",
                    )}
                  </span>
                  {responsive && index === 0 && (
                    <div className="flex flex-col items-start gap-1">
                      {columns
                        .slice(1)
                        .filter(
                          (detail) =>
                            detail.key !== "unit" &&
                            displayValue(record, detail.key, ""),
                        )
                        .map((detail) => (
                          <span
                            key={detail.key}
                            className="text-xs font-normal text-muted-foreground wrap-anywhere lg:hidden"
                          >
                            {detail.key === "category"
                              ? ""
                              : `${detail.label}: `}
                            {displayValue(record, detail.key)}
                          </span>
                        ))}
                      {columns[0]?.key === "supplier_name" &&
                        columns
                          .slice(1)
                          .every(
                            (detail) => !displayValue(record, detail.key, ""),
                          ) && (
                          <span className="text-xs font-normal text-muted-foreground lg:hidden">
                            No contact details
                          </span>
                        )}
                      <span className="md:hidden">
                        <CatalogRecordStatus active={record.is_active} />
                      </span>
                    </div>
                  )}
                </TableCell>
              ))}
              <TableCell
                className={responsive ? "hidden py-3 md:table-cell" : undefined}
              >
                {responsive ? (
                  <CatalogRecordStatus active={record.is_active} />
                ) : (
                  <Badge variant={record.is_active ? "secondary" : "outline"}>
                    {record.is_active ? "Active" : "Inactive"}
                  </Badge>
                )}
              </TableCell>
              <TableCell
                className={responsive ? "py-3 pr-4 sm:pr-5" : undefined}
              >
                <div className="flex justify-end">
                  <CatalogRowActions
                    record={record}
                    recordName={recordName}
                    canUpdate={canUpdate}
                    canDeactivate={canDeactivate}
                    onView={() => onView(record)}
                    onEdit={() => onEdit(record)}
                    onDeactivated={() => onDeactivated(record)}
                    deactivateAction={deactivateAction}
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
