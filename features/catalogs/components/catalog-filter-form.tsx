import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CatalogFilterForm({
  title,
  resourceName,
  routePath,
  search,
  activeFilter,
}: {
  title: string;
  resourceName: string;
  routePath: string;
  search: string;
  activeFilter: "all" | "true" | "false";
}) {
  return (
    <form
      action={routePath}
      method="get"
      className="grid gap-3 rounded-4xl border bg-card p-4 sm:grid-cols-[minmax(12rem,1fr)_12rem_auto] sm:items-end"
      aria-label={`Filter ${title.toLowerCase()}`}
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${resourceName}-search`}
          className="text-sm font-medium"
        >
          Search {title.toLowerCase()}
        </label>
        <Input
          id={`${resourceName}-search`}
          name="search"
          type="search"
          maxLength={160}
          defaultValue={search}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${resourceName}-status`}
          className="text-sm font-medium"
        >
          Status
        </label>
        <select
          id={`${resourceName}-status`}
          name="is_active"
          defaultValue={activeFilter}
          className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <option value="all">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      <Button type="submit" variant="outline">
        Apply filters
      </Button>
    </form>
  );
}
