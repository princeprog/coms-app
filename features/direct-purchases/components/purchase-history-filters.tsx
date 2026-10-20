import { ArrowDownWideNarrow, ArrowUpWideNarrow, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
import { DirectorySelect } from "@/components/shared/directory-select";
import type { usePurchaseHistory } from "../hooks/use-purchase-history";
export function PurchaseHistoryFilters({
  history,
}: {
  history: ReturnType<typeof usePurchaseHistory>;
}) {
  const { query, update } = history;
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Search store or receipt"
            placeholder="Search store or receipt"
            className="h-11 pl-10"
            maxLength={100}
            value={history.search}
            onChange={(e) => history.setSearch(e.target.value)}
          />
        </div>
        <DirectorySelect
          id="purchase-sort"
          label="Sort purchases"
          hideLabel
          alignItemWithTrigger={false}
          value={query.sort}
          className="[&_[data-slot=select-trigger]]:h-11"
          onChange={(value) => update({ sort: value as "newest" | "oldest" })}
          options={[
            {
              value: "newest",
              label: "Newest first",
              icon: <ArrowDownWideNarrow className="text-violet-600" />,
            },
            {
              value: "oldest",
              label: "Oldest first",
              icon: <ArrowUpWideNarrow className="text-violet-600" />,
            },
          ]}
        />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {(["purchased_from", "purchased_to"] as const).map((name) => (
          <div key={name} className="min-w-48 flex-1 sm:max-w-64">
            <label htmlFor={name} className="mb-2 block text-sm font-medium">
              {name === "purchased_from"
                ? "Purchased from"
                : "Purchased through"}
            </label>
            <DatePicker
              id={name}
              label={
                name === "purchased_from"
                  ? "Purchased from"
                  : "Purchased through"
              }
              value={query[name]}
              onChange={(value) => update({ [name]: value })}
              clearable
              className="h-11"
            />
          </div>
        ))}
        {(query.search ||
          query.purchased_from ||
          query.purchased_to ||
          query.sort !== "newest") && (
          <Button
            variant="ghost"
            className="h-11"
            onClick={() => {
              history.setSearch("");
              update({
                search: "",
                purchased_from: "",
                purchased_to: "",
                sort: "newest",
              });
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
      {query.purchased_from &&
        query.purchased_to &&
        query.purchased_from > query.purchased_to && (
          <p role="alert" className="text-sm text-destructive">
            The end date must be on or after the start date.
          </p>
        )}
    </div>
  );
}
