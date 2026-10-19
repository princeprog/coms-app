import type { DispatchItem } from "@/features/dispatches/types/dispatch.types";

export function DispatchCountReview({
  items,
  quantities,
  note,
}: {
  items: DispatchItem[];
  quantities: Record<string, string>;
  note: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Count summary</h3>
        <ul
          aria-label="Counted quantities"
          className="divide-y rounded-xl border"
        >
          <li
            aria-hidden="true"
            className="flex justify-between rounded-t-xl bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground"
          >
            <span>Stock item</span>
            <span>Received</span>
          </li>
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 px-4 py-4 text-sm"
            >
              <span className="wrap-anywhere">{item.stock_item_name}</span>
              <strong className="shrink-0 font-medium tabular-nums">
                {quantities[item.id]?.trim()} {item.unit}
              </strong>
            </li>
          ))}
        </ul>
      </div>
      {note.trim() && (
        <p className="text-sm wrap-anywhere">
          <span className="font-medium">Condition or issues: </span>
          {note.trim()}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        This final count can&apos;t be changed.
      </p>
    </div>
  );
}
