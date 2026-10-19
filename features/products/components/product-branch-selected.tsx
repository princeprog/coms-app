"use client";
import { useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const visibleLimit = 8;

function focusSearch() {
  document.getElementById("product-branch-search")?.focus();
}

export function ProductBranchSelected({
  ids,
  names,
  disabled,
  onRemove,
  onClear,
}: {
  ids: string[];
  names: Record<string, string>;
  disabled: boolean;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const tray = useRef<HTMLDivElement>(null);
  if (!ids.length) return null;
  const shown = ids.filter((id) => names[id]).slice(0, visibleLimit);
  const hidden = ids.length - shown.length;
  const remove = (id: string, index: number) => {
    onRemove(id);
    requestAnimationFrame(() => {
      const buttons = tray.current?.querySelectorAll("button");
      const next = buttons?.[Math.min(index, buttons.length - 1)];
      if (next) next.focus();
      else focusSearch();
    });
  };
  return (
    <div
      ref={tray}
      role="group"
      aria-label="Selected branches"
      className="flex flex-wrap items-center gap-1.5 rounded-lg border border-dashed bg-muted/30 p-2"
    >
      {shown.map((id, index) => (
        <span
          key={id}
          title={names[id]}
          className="inline-flex h-8 max-w-full items-center gap-1 rounded-md border bg-background pr-1 pl-2.5 text-sm sm:max-w-60"
        >
          <span className="min-w-0 truncate">{names[id]}</span>
          <button
            type="button"
            aria-label={`Remove ${names[id]}`}
            disabled={disabled}
            onClick={() => remove(id, index)}
            className="grid size-6 shrink-0 place-items-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </span>
      ))}
      {hidden > 0 && (
        <span className="px-1.5 text-sm text-muted-foreground">
          +{hidden} more
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-auto"
        disabled={disabled}
        onClick={() => {
          onClear();
          focusSearch();
        }}
      >
        Clear all
      </Button>
    </div>
  );
}
