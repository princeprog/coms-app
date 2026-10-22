import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import styles from "./daily-report-counts.module.css";

/** Stays in view at the bottom of long count lists. */
export function DailyReportCountSaveBar({
  dirty,
  pending,
  disabled,
  error,
  onDiscard,
}: {
  dirty: boolean;
  pending: boolean;
  disabled: boolean;
  error: string;
  onDiscard: () => void;
}) {
  return (
    <div
      data-dirty={dirty}
      className={cn(
        styles.saveBar,
        "sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t bg-card/95 px-5 py-3 backdrop-blur-sm",
      )}
    >
      <div className="min-w-0 text-sm" aria-live="polite">
        {error ? (
          <p role="alert" className="font-medium text-destructive">
            {error}
          </p>
        ) : dirty ? (
          <p className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-amber-500"
            />
            <span>
              <span className="font-medium">Unsaved changes</span>
              <span className="hidden text-muted-foreground sm:inline">
                {" "}
                · variance updates after you save
              </span>
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground">All counts saved</p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        {dirty && (
          <Button
            type="button"
            variant="ghost"
            className="min-h-10"
            disabled={pending}
            onClick={onDiscard}
          >
            Discard<span className="sr-only"> unsaved counts</span>
          </Button>
        )}
        <Button type="submit" className="min-h-10 gap-2" disabled={disabled}>
          {pending && (
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
            />
          )}
          {pending ? "Saving…" : "Save counts"}
        </Button>
      </div>
    </div>
  );
}
