import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  CatalogFieldDefinition,
  CatalogRecord,
} from "@/features/catalogs/types/catalog.types";

function recordValue(record: CatalogRecord, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : "—";
}

export function CatalogDetailsDialog({
  record,
  resourceName,
  fields,
  open,
  onOpenChange,
}: {
  record: CatalogRecord | null;
  resourceName: string;
  fields: CatalogFieldDefinition[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const label = resourceName[0]?.toUpperCase() + resourceName.slice(1);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-coms-ui="operational"
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>{label} details</DialogTitle>
          <DialogDescription>
            Read the full saved catalog information.
          </DialogDescription>
        </DialogHeader>
        {record && (
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className="min-w-0">
                <dt className="text-xs font-medium text-muted-foreground">
                  {field.label}
                </dt>
                <dd className="mt-1 break-words text-sm">
                  {recordValue(record, field.key)}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Status
              </dt>
              <dd className="mt-1 text-sm">
                {record.is_active ? "Active" : "Inactive"}
              </dd>
            </div>
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}
