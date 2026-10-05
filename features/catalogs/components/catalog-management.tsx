"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OperationalPageIntro } from "@/components/shared/operational-page-ui";
import { CatalogDetailsDialog } from "@/features/catalogs/components/catalog-details-dialog";
import { CatalogEditorDialog } from "@/features/catalogs/components/catalog-editor-dialog";
import { CatalogFilterForm } from "@/features/catalogs/components/catalog-filter-form";
import { CatalogCollection } from "./catalog-collection";
import { CatalogDirectoryFilter } from "./catalog-directory-filter";
import { Plus } from "lucide-react";
import type {
  CatalogRecord,
  CatalogManagementProps,
} from "../types/catalog.types";

export function CatalogManagement({
  title,
  resourceName,
  description,
  routePath,
  displayColumns,
  fields,
  page,
  search,
  activeFilter,
  canCreate,
  canUpdate,
  canDeactivate,
  createAction,
  updateAction,
  deactivateAction,
  directoryLayout = false,
}: CatalogManagementProps) {
  const router = useRouter();
  const [editorRecord, setEditorRecord] = useState<CatalogRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState<CatalogRecord | null>(
    null,
  );
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const resourceLabel = resourceName[0]?.toUpperCase() + resourceName.slice(1);

  function openCreate() {
    setEditorRecord(null);
    setEditorOpen(true);
  }

  function openEdit(record: CatalogRecord) {
    setEditorRecord(record);
    setEditorOpen(true);
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {directoryLayout ? (
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {canCreate && (
            <Button onClick={openCreate}>
              <Plus aria-hidden="true" data-icon="inline-start" />
              Add {resourceName}
            </Button>
          )}
        </header>
      ) : (
        <OperationalPageIntro
          description={description}
          count={
            <Badge variant="outline">
              {page.total}{" "}
              {page.total === 1 ? resourceName : `${resourceName}s`}
            </Badge>
          }
          actions={
            canCreate ? (
              <Button type="button" onClick={openCreate}>
                Add {resourceName}
              </Button>
            ) : undefined
          }
        />
      )}

      {directoryLayout ? (
        <CatalogDirectoryFilter
          title={title}
          resourceName={resourceName}
          routePath={routePath}
          filters={{ page: page.page, search, active: activeFilter }}
          onPendingChange={setPending}
        />
      ) : (
        <CatalogFilterForm
          title={title}
          resourceName={resourceName}
          routePath={routePath}
          search={search}
          activeFilter={activeFilter}
        />
      )}

      <CatalogCollection
        title={title}
        page={page}
        routePath={routePath}
        resourceName={resourceName}
        search={search}
        activeFilter={activeFilter}
        directoryLayout={directoryLayout}
        pending={pending}
        canCreate={canCreate}
        onCreate={openCreate}
        columns={displayColumns}
        canUpdate={canUpdate}
        canDeactivate={canDeactivate}
        onView={setDetailsRecord}
        onEdit={openEdit}
        onDeactivated={(record) => {
          setStatus(
            `${resourceLabel} deactivated.${directoryLayout && activeFilter === "true" ? " Removed from the Active view." : ""}`,
          );
          setDetailsRecord((current) =>
            current?.id === record.id
              ? { ...current, is_active: false }
              : current,
          );
          router.refresh();
        }}
        deactivateAction={deactivateAction}
      />

      {editorOpen && (canCreate || canUpdate) && (
        <CatalogEditorDialog
          key={editorRecord ? `edit-${editorRecord.id}` : "create"}
          open={editorOpen}
          record={editorRecord}
          resourceName={resourceName}
          fields={fields}
          createAction={createAction}
          updateAction={updateAction}
          onOpenChange={(open) => {
            setEditorOpen(open);
            if (!open) setEditorRecord(null);
          }}
          onComplete={(message) => {
            setStatus(message);
            router.refresh();
          }}
        />
      )}
      <CatalogDetailsDialog
        open={detailsRecord !== null}
        record={detailsRecord}
        resourceName={resourceName}
        fields={fields}
        onOpenChange={(open) => {
          if (!open) setDetailsRecord(null);
        }}
      />
      {status && (
        <p
          role="status"
          className="text-sm text-muted-foreground"
          aria-live="polite"
        >
          {status}
        </p>
      )}
    </div>
  );
}
