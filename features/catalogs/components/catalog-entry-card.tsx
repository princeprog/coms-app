import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CatalogDeactivateControl } from "@/features/catalogs/components/catalog-deactivate-control";
import type {
  CatalogDeactivateAction,
  CatalogFieldDefinition,
  CatalogRecord,
} from "@/features/catalogs/types/catalog.types";

function recordValue(record: CatalogRecord, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : "—";
}

export function CatalogEntryCard({
  record,
  nameField,
  resourceName,
  fields,
  canUpdate,
  canDeactivate,
  onEdit,
  onDeactivated,
  deactivateAction,
}: {
  record: CatalogRecord;
  nameField: string;
  resourceName: string;
  fields: CatalogFieldDefinition[];
  canUpdate: boolean;
  canDeactivate: boolean;
  onEdit: (record: CatalogRecord) => void;
  onDeactivated: () => void;
  deactivateAction: CatalogDeactivateAction;
}) {
  const name = recordValue(record, nameField);
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="break-words text-base">{name}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {record.is_active ? "Active" : "Inactive"}
          </p>
        </div>
        <Badge variant={record.is_active ? "secondary" : "outline"}>
          {record.is_active ? "Active" : "Inactive"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {fields.length > 1 && (
          <dl className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
            {fields
              .filter((field) => field.key !== nameField)
              .map((field) => (
                <div key={field.key} className="min-w-0">
                  <dt className="text-xs font-medium text-muted-foreground">
                    {field.label}
                  </dt>
                  <dd className="mt-1 break-words text-sm">
                    {recordValue(record, field.key)}
                  </dd>
                </div>
              ))}
          </dl>
        )}
        {(canUpdate || (canDeactivate && record.is_active)) && (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            {canUpdate && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onEdit(record)}
                aria-label={`Edit ${name}`}
              >
                Edit
              </Button>
            )}
            {canDeactivate && record.is_active && (
              <CatalogDeactivateControl
                recordId={record.id}
                recordName={name}
                resourceName={resourceName}
                action={deactivateAction}
                onComplete={onDeactivated}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
