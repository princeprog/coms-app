import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CatalogRowActions } from "@/features/catalogs/components/catalog-row-actions";
import type {
  CatalogDeactivateAction,
  CatalogDisplayColumn,
  CatalogRecord,
} from "@/features/catalogs/types/catalog.types";

function displayValue(record: CatalogRecord, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : "—";
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
}) {
  return (
    <div className="overflow-x-auto">
      <Table aria-label={title}>
        <TableHeader className="bg-muted/40">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                    className={
                      index === 0 ? "max-w-64 font-medium" : "max-w-56"
                    }
                  >
                    <span
                      className="block truncate"
                      title={displayValue(record, column.key)}
                    >
                      {displayValue(record, column.key)}
                    </span>
                  </TableCell>
                ))}
                <TableCell>
                  <Badge variant={record.is_active ? "secondary" : "outline"}>
                    {record.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
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
    </div>
  );
}
