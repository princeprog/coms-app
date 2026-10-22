import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatPeso } from "../services/shift-money";

/** A titled report section; content manages its own padding. */
export function ShiftReportCard({
  id,
  title,
  aside,
  children,
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="min-w-0 overflow-hidden rounded-2xl bg-card shadow-xs ring-1 ring-foreground/10"
    >
      <div className="flex min-h-14 items-center justify-between gap-3 px-5 pt-4 pb-2 sm:px-6">
        <h2 id={id} className="text-base font-semibold">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** One statement row inside a `<dl>`. */
export function ShiftReportLine({
  label,
  hint,
  value,
  strong = false,
}: {
  label: string;
  hint?: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-2 sm:px-6">
      <dt className={cn("min-w-0", strong && "font-semibold")}>
        {label}
        {hint && (
          <span className="block text-xs font-normal text-muted-foreground">
            {hint}
          </span>
        )}
      </dt>
      <dd
        className={cn(
          "shrink-0 text-right tabular-nums",
          strong && "text-base font-semibold",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function SignedAmount({
  sign,
  value,
}: {
  sign: "+" | "−";
  value: string | null;
}) {
  return (
    <>
      <span className="mr-1 text-muted-foreground">{sign}</span>
      {formatPeso(value)}
    </>
  );
}

export function ShiftReportEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="px-5 pt-1 pb-6 text-sm text-muted-foreground sm:px-6">
      {children}
    </p>
  );
}

export const plural = (count: number, word: string) =>
  `${count} ${count === 1 ? word : `${word}s`}`;
