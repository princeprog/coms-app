import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShiftStepper({
  steps,
  current,
}: {
  steps: readonly string[];
  current: number;
}) {
  return (
    <ol aria-label="End shift progress" className="flex items-center gap-2">
      {steps.map((label, index) => {
        const finished = current === steps.length - 1;
        const done = index < current || finished;
        const active = index === current && !finished;
        return (
          <li
            key={label}
            className="flex min-w-0 flex-1 items-center gap-2"
            aria-current={index === current ? "step" : undefined}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-[background-color,border-color,color] duration-200 ease-out",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary",
                !done && !active && "text-muted-foreground",
              )}
            >
              {done ? (
                <Check aria-hidden="true" className="size-3.5" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                "truncate text-sm",
                index === current ? "font-medium" : "text-muted-foreground",
                "max-sm:sr-only",
              )}
            >
              {label}
            </span>
            {index < steps.length - 1 && (
              <span aria-hidden="true" className="h-px flex-1 bg-border">
                <span
                  className={cn(
                    "block h-px origin-left bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none",
                    done ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
