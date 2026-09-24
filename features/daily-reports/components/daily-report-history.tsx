import type { DailyReport } from "@/features/daily-reports/types/daily-report.types";

const eventLabels: Record<DailyReport["events"][number]["event_type"], string> =
  {
    CREATED: "Draft created",
    UPDATED: "Report updated",
    SUBMITTED: "Submitted for review",
    RETURNED: "Returned for correction",
    APPROVED: "Approved",
  };

const manilaTime = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export function DailyReportHistory({ report }: { report: DailyReport }) {
  return (
    <section
      aria-labelledby="daily-report-history-title"
      className="rounded-4xl border bg-card p-4"
    >
      <h3 id="daily-report-history-title" className="font-medium">
        Review history
      </h3>
      {report.events.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No report actions have been recorded yet.
        </p>
      ) : (
        <ol className="mt-4 grid gap-3">
          {report.events.map((event) => (
            <li key={event.id} className="grid gap-1 border-l-2 pl-3 text-sm">
              <p className="font-medium">
                {eventLabels[event.event_type]} · {event.actor_name}
              </p>
              <time
                dateTime={event.created_at}
                className="text-muted-foreground"
              >
                {manilaTime.format(new Date(event.created_at))} (Asia/Manila)
              </time>
              {event.note && (
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {event.note}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
