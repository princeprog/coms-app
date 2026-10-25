import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Bordered report section with a titled header row. */
export function ReportPanel({
  id,
  title,
  aside,
  className,
  children,
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "flex min-w-0 flex-col rounded-xl border bg-card",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3 border-b px-4 py-3">
        <h2 id={id} className="font-semibold">
          {title}
        </h2>
        {aside && <p className="text-xs text-muted-foreground">{aside}</p>}
      </div>
      {children}
    </section>
  );
}

export function ReportPanelEmpty() {
  return (
    <p className="px-4 py-6 text-sm text-muted-foreground">
      No sales in this period.
    </p>
  );
}
