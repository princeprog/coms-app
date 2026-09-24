"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  OperationalEmptyState,
  OperationalPageIntro,
} from "@/components/shared/operational-page-ui";
import { CatalogDetailsDialog } from "@/features/catalogs/components/catalog-details-dialog";
import { CatalogEditorDialog } from "@/features/catalogs/components/catalog-editor-dialog";
import { CatalogFilterForm } from "@/features/catalogs/components/catalog-filter-form";
import { CatalogPagination } from "@/features/catalogs/components/catalog-pagination";
import { CatalogTable } from "@/features/catalogs/components/catalog-table";
import type {
  CatalogCreateAction,
  CatalogDeactivateAction,
  CatalogDisplayColumn,
  CatalogFieldDefinition,
  CatalogPage,
  CatalogRecord,
  CatalogUpdateAction,
} from "@/features/catalogs/types/catalog.types";

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
}: {
  title: string;
  resourceName: string;
  description: string;
  routePath: string;
  displayColumns: CatalogDisplayColumn[];
  fields: CatalogFieldDefinition[];
  page: CatalogPage;
  search: string;
  activeFilter: "all" | "true" | "false";
  canCreate: boolean;
  canUpdate: boolean;
  canDeactivate: boolean;
  createAction: CatalogCreateAction;
  updateAction: CatalogUpdateAction;
  deactivateAction: CatalogDeactivateAction;
}) {
  const router = useRouter();
  const [editorRecord, setEditorRecord] = useState<CatalogRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState<CatalogRecord | null>(
    null,
  );
  const [status, setStatus] = useState("");
  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
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
    <div className="flex flex-col gap-6">
      <OperationalPageIntro
        description={description}
        count={
          <Badge variant="outline">
            {page.total} {page.total === 1 ? resourceName : `${resourceName}s`}
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

      <CatalogFilterForm
        title={title}
        resourceName={resourceName}
        routePath={routePath}
        search={search}
        activeFilter={activeFilter}
      />

      <section
        aria-labelledby="catalog-directory-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="catalog-directory-heading" className="text-lg font-semibold">
            Directory
          </h2>
          {page.total > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {page.items.length} of {page.total} · Page {page.page} of{" "}
              {pageCount}
            </p>
          )}
        </div>

        {page.items.length > 0 ? (
          <div className="overflow-hidden rounded-lg border bg-card">
            <CatalogTable
              title={title}
              pageItems={page.items}
              columns={displayColumns}
              canUpdate={canUpdate}
              canDeactivate={canDeactivate}
              onView={setDetailsRecord}
              onEdit={openEdit}
              onDeactivated={(record) => {
                setStatus(`${resourceLabel} deactivated.`);
                setDetailsRecord((current) =>
                  current?.id === record.id
                    ? { ...current, is_active: false }
                    : current,
                );
                router.refresh();
              }}
              deactivateAction={deactivateAction}
            />
          </div>
        ) : (
          <OperationalEmptyState
            title={
              search || activeFilter !== "all"
                ? `No ${title.toLowerCase()} found`
                : `No ${title.toLowerCase()} yet`
            }
            description={
              search || activeFilter !== "all"
                ? "Try changing or clearing the current filters."
                : canCreate
                  ? `Add the first ${resourceName} to get started.`
                  : `Ask an administrator to add a ${resourceName}.`
            }
          />
        )}

        <CatalogPagination
          title={title}
          routePath={routePath}
          page={page.page}
          pageCount={pageCount}
          search={search}
          activeFilter={activeFilter}
        />
      </section>

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
