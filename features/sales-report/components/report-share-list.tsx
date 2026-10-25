import { cn } from "@/lib/utils";
import { ReportPanel, ReportPanelEmpty } from "./report-panel";

// Each breakdown gets its own hue so sections read apart at a glance.
const barColors = {
  sky: "bg-sky-500 dark:bg-sky-400",
  emerald: "bg-emerald-500 dark:bg-emerald-400",
} as const;

export type ShareRow = {
  key: string;
  name: string;
  detail?: string;
  value: string;
  /** 0–100; drives the bar under the row. */
  share: number;
  shareLabel?: string;
};

/** A ranked list where each row carries a proportional bar. */
export function ReportShareList({
  id,
  title,
  rows,
  color = "sky",
  className,
}: {
  id: string;
  title: string;
  rows: ShareRow[];
  color?: keyof typeof barColors;
  className?: string;
}) {
  return (
    <ReportPanel id={id} title={title} className={className}>
      {rows.length === 0 ? (
        <ReportPanelEmpty />
      ) : (
        <ul aria-label={title} className="flex flex-col gap-3 p-4">
          {rows.map((row) => (
            <li key={row.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">
                  {row.name}
                  {row.detail && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      {row.detail}
                    </span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums">
                  {row.value}
                  {row.shareLabel && (
                    <span className="ml-2 inline-block w-12 text-right text-muted-foreground">
                      {row.shareLabel}
                    </span>
                  )}
                </span>
              </div>
              <div
                aria-hidden="true"
                className="h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className={cn(
                    "h-full w-full origin-left rounded-full transition-transform duration-300 ease-out-quint motion-reduce:transition-none",
                    barColors[color],
                  )}
                  style={{
                    transform: `scaleX(${Math.min(100, Math.max(0, row.share)) / 100})`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ReportPanel>
  );
}
