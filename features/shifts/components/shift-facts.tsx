import type { ReactNode } from "react";
import type { ShiftReport } from "../schemas/shift.schema";
import {
  businessDayLabel,
  shiftDateTime,
  shiftDuration,
  shiftTime,
} from "../services/shift-time";

function When({ value }: { value: string }) {
  return <time dateTime={value}>{shiftDateTime(value)}</time>;
}

export function ShiftFacts({ shift }: { shift: ShiftReport }) {
  const open = shift.status === "OPEN";
  const sales = shift.sales_summary;
  const facts: { label: string; value: ReactNode }[] = [
    { label: "Branch", value: shift.branch_name || "—" },
    { label: "Business day", value: businessDayLabel(shift.business_date) },
    { label: "Cashier", value: shift.opened_by_name },
    { label: "Opened", value: <When value={shift.opened_at} /> },
    {
      label: "Closed",
      value: shift.closed_at ? <When value={shift.closed_at} /> : "Still open",
    },
    {
      label: "Duration",
      value: `${shiftDuration(shift.opened_at, shift.closed_at ?? new Date())}${open ? " so far" : ""}`,
    },
  ];
  if (sales?.first_sale_at && sales.last_sale_at)
    facts.push({
      label: "First and last sale",
      value: `${shiftTime(sales.first_sale_at)} – ${shiftTime(sales.last_sale_at)}`,
    });
  if (shift.close_type === "FORCED")
    facts.push({
      label: "Force closed by",
      value: shift.closed_by_name ?? "A manager",
    });
  if (shift.reviewed_at)
    facts.push({
      label: "Reviewed by",
      value: shift.reviewed_by_name ?? "A manager",
    });
  return (
    <section
      aria-labelledby="shift-facts-heading"
      className="min-w-0 rounded-2xl bg-muted/30 p-5 ring-1 ring-foreground/10 sm:p-6"
    >
      <h2 id="shift-facts-heading" className="mb-5 text-base font-semibold">
        Shift details
      </h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 xl:grid-cols-1">
        {facts.map(({ label, value }) => (
          <div key={label} className="flex min-w-0 flex-col gap-1">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-medium wrap-anywhere">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
