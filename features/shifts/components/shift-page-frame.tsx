import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Focused, centered layout for start and end of shift. */
export function ShiftPageFrame({
  icon: Icon,
  title,
  description,
  aside,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      data-coms-ui="operational"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-2 sm:py-6"
    >
      <header className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border bg-card text-primary shadow-xs">
          <Icon aria-hidden="true" className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {aside}
      </header>
      {children}
    </div>
  );
}
