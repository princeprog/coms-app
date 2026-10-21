"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AuditArea, AuditEvent } from "../schemas/audit.schema";
import {
  auditAreaLabels,
  describeAction,
  fieldLabel,
  formatAuditTime,
  formatFieldValue,
  metadataEntries,
  visibleChanges,
} from "../services/audit-format";

function ChangeTable({ event }: { event: AuditEvent }) {
  const changes = visibleChanges(event);
  if (!changes.length) return null;
  const created = event.action.endsWith(".created");
  const deleted = event.action.endsWith(".deleted");
  const single = created || deleted;
  return (
    <section aria-labelledby="audit-changes" className="flex flex-col gap-2">
      <h3 id="audit-changes" className="text-sm font-medium">
        {created ? "Saved values" : deleted ? "Last values" : "Changes"}
      </h3>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr className="border-b">
            <th scope="col" className="py-2 pr-3 font-medium">
              Field
            </th>
            {single ? (
              <th scope="col" className="py-2 font-medium">
                Value
              </th>
            ) : (
              <>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Before
                </th>
                <th scope="col" className="py-2 font-medium">
                  After
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {changes.map(([field, change]) => (
            <tr key={field} className="border-b align-top last:border-0">
              <th
                scope="row"
                className="py-2 pr-3 text-left font-normal text-muted-foreground"
              >
                {fieldLabel(field)}
              </th>
              {single ? (
                <td className="py-2 break-words">
                  {formatFieldValue(field, created ? change.to : change.from)}
                </td>
              ) : (
                <>
                  <td className="py-2 pr-3 break-words text-muted-foreground">
                    {formatFieldValue(field, change.from)}
                  </td>
                  <td className="py-2 break-words">
                    {formatFieldValue(field, change.to)}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function AuditEventSheet({
  event,
  onOpenChange,
}: {
  event: AuditEvent | null;
  onOpenChange: (open: boolean) => void;
}) {
  const details = event ? metadataEntries(event) : [];
  return (
    <Sheet open={event !== null} onOpenChange={onOpenChange}>
      <SheetContent
        data-coms-ui="operational"
        side="right"
        showCloseButton
        className="h-full w-full gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        {event && (
          <>
            <SheetHeader className="border-b pr-16">
              <SheetTitle>{describeAction(event)}</SheetTitle>
              <SheetDescription>
                {event.entity_label ?? "Record"} ·{" "}
                {auditAreaLabels[event.entity_type as AuditArea] ??
                  event.entity_type}
              </SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-6">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-muted-foreground">When</dt>
                <dd>{formatAuditTime(event.occurred_at)}</dd>
                <dt className="text-muted-foreground">Who</dt>
                <dd>{event.actor_name ?? "System"}</dd>
              </dl>
              <ChangeTable event={event} />
              {details.map((detail) => (
                <section key={detail.key} className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">{detail.label}</h3>
                  {detail.items.length === 1 ? (
                    <p className="text-sm break-words">{detail.items[0]}</p>
                  ) : (
                    <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
                      {detail.items.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
