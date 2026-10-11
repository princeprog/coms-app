import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OperationalPageIntro } from "@/components/shared/operational-page-ui";
import { Plus } from "lucide-react";
export function CatalogPageIntro({
  title,
  resourceName,
  description,
  directoryLayout,
  total,
  canCreate,
  onCreate,
  secondaryActions,
}: {
  title: string;
  resourceName: string;
  description: string;
  directoryLayout: boolean;
  total: number;
  canCreate: boolean;
  onCreate: () => void;
  secondaryActions?: ReactNode;
}) {
  return (
    <>
      {" "}
      {directoryLayout ? (
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {secondaryActions}
            {canCreate && (
              <Button onClick={onCreate}>
                <Plus aria-hidden="true" data-icon="inline-start" />
                Add {resourceName}
              </Button>
            )}
          </div>
        </header>
      ) : (
        <OperationalPageIntro
          description={description}
          count={
            <Badge variant="outline">
              {total} {total === 1 ? resourceName : `${resourceName}s`}
            </Badge>
          }
          actions={
            <div className="flex flex-wrap gap-2">
              {secondaryActions}
              {canCreate ? (
                <Button type="button" onClick={onCreate}>
                  Add {resourceName}
                </Button>
              ) : null}
            </div>
          }
        />
      )}
    </>
  );
}
