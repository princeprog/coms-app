import Link from "next/link";
import { count, peso } from "@/lib/metric-format";
import type { DashboardAttention } from "../schemas/dashboard-today.schema";
import { attentionExampleHref } from "../services/dashboard-links";

const timestamp = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export function AttentionDetail({ item }: { item: DashboardAttention }) {
  if (!item.example) return null;
  const example = item.example;
  const description = [
    example.branch_name,
    example.label,
    example.quantity !== null
      ? `${count(example.quantity)} ${example.unit ?? ""} on hand`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="pb-3 pl-13 pr-3 text-xs text-muted-foreground">
      {(item.amount || (item.branch_count ?? 0) > 1) && (
        <p className="mb-1">
          {[
            item.amount ? `${peso(item.amount)} total short` : null,
            (item.branch_count ?? 0) > 1
              ? `${item.branch_count} branches affected`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      <Link
        href={attentionExampleHref(item)}
        className="block rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        {item.oldest_at ? "Oldest: " : "View: "}
        {description || "View details"}
        {item.oldest_at && (
          <span className="mt-0.5 block">
            <time dateTime={item.oldest_at}>
              {timestamp(item.oldest_at)} PHT
            </time>
          </span>
        )}
      </Link>
    </div>
  );
}
