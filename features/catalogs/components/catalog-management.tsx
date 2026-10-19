"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CatalogPageIntro } from "./catalog-page-intro";
import { CatalogDetailsDialog } from "@/features/catalogs/components/catalog-details-dialog";
import { CatalogEditorDialog } from "@/features/catalogs/components/catalog-editor-dialog";
import { CatalogFilterForm } from "@/features/catalogs/components/catalog-filter-form";
import { CatalogCollection } from "./catalog-collection";
import { CatalogDirectoryFilter } from "./catalog-directory-filter";
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
  directoryTitle,
  directoryDescription,
  secondaryActions,
  detailsPath,
  setupEnabled = false,
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
    if (setupEnabled) {
      router.push("/products/new");
      return;
    }
    setEditorRecord(null);
    setEditorOpen(true);
  }

  function openEdit(record: CatalogRecord) {
    if (setupEnabled) {
      router.push(`/products/${record.id}/setup`);
      return;
    }
    setEditorRecord(record);
    setEditorOpen(true);
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <CatalogPageIntro
        title={title}
        resourceName={resourceName}
        description={description}
        directoryLayout={directoryLayout}
        total={page.total}
        canCreate={canCreate}
        onCreate={openCreate}
        secondaryActions={secondaryActions}
      />

      {directoryLayout ? (
        <CatalogDirectoryFilter
          title={title}
          resourceName={resourceName}
          routePath={routePath}
          filters={{
            page: page.page,
            ...(["/products", "/stock-items"].includes(routePath)
              ? { pageSize: page.page_size }
              : {}),
            search,
            active: activeFilter,
          }}
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
        directoryTitle={directoryTitle}
        directoryDescription={directoryDescription}
        pending={pending}
        canCreate={canCreate}
        onCreate={openCreate}
        columns={displayColumns}
        canUpdate={canUpdate}
        canDeactivate={canDeactivate}
        onView={(record) =>
          detailsPath
            ? router.push(`${detailsPath}/${record.id}`)
            : setDetailsRecord(record)
        }
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
