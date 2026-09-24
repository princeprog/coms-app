import Form from "next/form";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const hasFilters = Boolean(search) || activeFilter !== "all";
  const idPrefix = resourceName.replaceAll(" ", "-");

  return (
    <Form
      action={routePath}
      className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[minmax(12rem,1fr)_12rem_auto_auto] sm:items-end"
      aria-label={`Filter ${title.toLowerCase()}`}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <label htmlFor={`${idPrefix}-search`} className="text-sm font-medium">
          Search {title.toLowerCase()}
        </label>
        <Input
          id={`${idPrefix}-search`}
          name="search"
          type="search"
          maxLength={160}
          defaultValue={search}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <label htmlFor={`${idPrefix}-status`} className="text-sm font-medium">
          Status
        </label>
        <Select name="is_active" defaultValue={activeFilter}>
          <SelectTrigger id={`${idPrefix}-status`} className="w-full">
            <SelectValue>
              {(value: unknown) =>
                value === "true"
                  ? "Active"
                  : value === "false"
                    ? "Inactive"
                    : "All statuses"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent data-coms-ui="operational">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" variant="outline">
        Apply filters
      </Button>
      {hasFilters ? (
        <Link className={buttonVariants({ variant: "ghost" })} href={routePath}>
          Clear filters
        </Link>
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}
    </Form>
  );
}
