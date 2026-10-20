"use client";
import Link from "next/link";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { DailyReport } from "../types/daily-report.types";

export function DailyReportDeliveries({
  report,
  reasons,
  onChange,
  attempted,
  pending,
}: {
  report: DailyReport;
  reasons: Record<string, string>;
  onChange: (id: string, value: string) => void;
  attempted: boolean;
  pending: boolean;
}) {
  if (!report.pending_deliveries?.length) return null;
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">Pending deliveries</h3>
      <p className="text-sm text-muted-foreground">
        Count arrived stock before submitting. For deliveries not received by
        day-end, record the reason below.
      </p>
      {report.pending_deliveries.map((item) => (
        <div key={item.id} className="space-y-3 border-t pt-3">
          <Link
            className="text-sm font-medium underline underline-offset-4"
            href={`/dispatches/${item.id}`}
          >
            Delivery {item.id.slice(0, 8).toUpperCase()} ·{" "}
            {item.receiving_status === "REVIEW"
              ? "View count review"
              : "Count delivery"}
          </Link>
          <Field data-invalid={attempted && !reasons[item.id]?.trim()}>
            <FieldLabel htmlFor={`delivery-exception-${item.id}`}>
              Not arrived by day-end — reason
            </FieldLabel>
            <Textarea
              id={`delivery-exception-${item.id}`}
              disabled={pending}
              maxLength={500}
              value={reasons[item.id] ?? ""}
              aria-invalid={attempted && !reasons[item.id]?.trim()}
              aria-describedby={
                attempted && !reasons[item.id]?.trim()
                  ? `exception-error-${item.id}`
                  : undefined
              }
              onChange={(e) => onChange(item.id, e.target.value)}
            />
            {attempted && !reasons[item.id]?.trim() && (
              <FieldError id={`exception-error-${item.id}`}>
                Count the delivery or explain why it had not arrived.
              </FieldError>
            )}
          </Field>
        </div>
      ))}
    </div>
  );
}

export function DailyReportDeliveryHistory({
  report,
}: {
  report: DailyReport;
}) {
  if (!report.delivery_exceptions?.length) return null;
  return (
    <section
      className="space-y-3 rounded-lg border p-4"
      aria-label="Delivery exceptions"
    >
      <h3 className="font-semibold">Delivery exceptions</h3>
      <ul className="divide-y">
        {report.delivery_exceptions.map((item, index) => (
          <li
            key={`${item.report_event_id}-${item.dispatch_id}-${index}`}
            className="space-y-1 py-3 text-sm"
          >
            <Link
              className="font-medium underline underline-offset-4"
              href={`/dispatches/${item.dispatch_id}`}
            >
              Delivery {item.dispatch_id.slice(0, 8).toUpperCase()}
            </Link>
            <p>Not arrived by day-end: {item.reason}</p>
            <p className="text-muted-foreground">
              {item.counted_at ? "Count now recorded" : "Count still pending"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
