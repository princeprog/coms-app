import type { ExpenseDetail } from "../schemas/expense.schema";
import { expenseDate, paymentLabels, pesos } from "../services/expense-format";

const labels: Record<string, string> = {
  expense_date: "Expense date",
  description: "Description",
  amount: "Amount",
  payment_method: "Payment",
  cash_source: "Cash source",
  payee: "Payee",
  reference: "Reference",
  notes: "Notes",
  status: "Status",
  category_name: "Category",
  location_name: "Location",
};
function display(key: string, value: unknown) {
  if (value === null || value === undefined || value === "")
    return "Not specified";
  if (
    key === "amount" &&
    typeof value === "string" &&
    /^\d+(\.\d+)?$/.test(value)
  )
    return pesos(value);
  if (key === "expense_date" && typeof value === "string")
    return expenseDate(value);
  if (key === "payment_method")
    return paymentLabels[value as keyof typeof paymentLabels] ?? String(value);
  if (key === "cash_source")
    return value === "REGISTER" ? "Register cash out" : "Other cash";
  if (key === "status") return value === "RECORDED" ? "Recorded" : "Voided";
  return String(value);
}
export function ExpenseHistory({
  history,
}: {
  history: ExpenseDetail["history"];
}) {
  return (
    <section aria-label="Expense history" className="space-y-3">
      <h3 className="font-medium">History</h3>
      {history.length ? (
        <ol className="space-y-3">
          {history.map((event) => (
            <li key={event.id} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">
                {
                  {
                    CREATED: "Recorded",
                    UPDATED: "Corrected",
                    VOIDED: "Voided",
                  }[event.action]
                }{" "}
                · {event.actor_name ?? "Staff"}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("en-PH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Manila",
                }).format(new Date(event.created_at))}{" "}
                (Manila)
              </p>
              {event.reason && (
                <p className="mt-2 whitespace-pre-wrap">{event.reason}</p>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-xs">
                  View saved values
                </summary>
                <dl className="mt-2 space-y-2">
                  {Object.entries(labels)
                    .filter(
                      ([key]) =>
                        key in event.after &&
                        (event.before === null ||
                          event.before[key] !== event.after[key]),
                    )
                    .map(([key, label]) => (
                      <div key={key} className="grid gap-1 sm:grid-cols-3">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="break-words whitespace-pre-wrap sm:col-span-2">
                          {event.before && (
                            <span>{display(key, event.before[key])} → </span>
                          )}
                          {display(key, event.after[key])}
                        </dd>
                      </div>
                    ))}
                </dl>
              </details>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">
          No history is available for your permitted locations.
        </p>
      )}
    </section>
  );
}
