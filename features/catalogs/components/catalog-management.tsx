"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CatalogFilterForm } from "@/features/catalogs/components/catalog-filter-form";
import { CatalogEditorDialog } from "@/features/catalogs/components/catalog-editor-dialog";
import { CatalogEntryCard } from "@/features/catalogs/components/catalog-entry-card";
import { CatalogPagination } from "@/features/catalogs/components/catalog-pagination";
import type {
  CatalogCreateAction,
  CatalogDeactivateAction,
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
  nameField,
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
  nameField: string;
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
      <section
        className="flex flex-wrap items-center justify-between gap-4"
        aria-label={`${title} summary`}
      >
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        <div className="flex items-center gap-3">
          <Badge variant="outline">
            {page.total} {page.total === 1 ? resourceName : `${resourceName}s`}
          </Badge>
          {canCreate && (
            <Button type="button" onClick={openCreate}>
              Add {resourceName}
            </Button>
          )}
        </div>
      </section>

      <CatalogFilterForm
        title={title}
        resourceName={resourceName}
        routePath={routePath}
        search={search}
        activeFilter={activeFilter}
      />

      <section
        aria-labelledby={`${resourceName}-directory-heading`}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id={`${resourceName}-directory-heading`}
              className="text-lg font-semibold"
            >
              {title} directory
            </h2>
            <p className="text-sm text-muted-foreground">
              Page {page.page} of {pageCount}
            </p>
          </div>
          {page.total > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {page.items.length} of {page.total}
            </p>
          )}
        </div>
        {page.items.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {page.items.map((record) => (
              <CatalogEntryCard
                key={record.id}
                record={record}
                nameField={nameField}
                resourceName={resourceName}
                fields={fields}
                canUpdate={canUpdate}
                canDeactivate={canDeactivate}
                onEdit={openEdit}
                onDeactivated={() => {
                  setStatus(`${resourceLabel} deactivated.`);
                  router.refresh();
                }}
                deactivateAction={deactivateAction}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="font-medium">
                {search || activeFilter !== "all"
                  ? `No ${title.toLowerCase()} match these filters.`
                  : `No ${title.toLowerCase()} are available yet.`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {canCreate
                  ? `Add the first ${resourceName} to get started.`
                  : `Ask an administrator to add a ${resourceName}.`}
              </p>
            </CardContent>
          </Card>
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
