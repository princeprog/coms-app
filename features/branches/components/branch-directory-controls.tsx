"use client";

import type { ReactNode } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DirectorySelect } from "@/components/shared/directory-select";
import { useDirectoryQuery } from "@/hooks/use-directory-query";
import { branchDirectoryHref } from "../services/branch-directory-params";
import type { BranchDirectoryFilters } from "../types/branch.types";

export function BranchDirectoryControls({
  filters,
  children,
}: {
  filters: BranchDirectoryFilters;
  children: ReactNode;
}) {
  const query = useDirectoryQuery(filters, branchDirectoryHref);
  const value = filters.status || "all";
  const active = Boolean(
    filters.search || filters.status || filters.service_type,
  );
  function clear() {
    query.changeSearch("");
    query.apply({ search: "", status: "", service_type: "" });
  }
  return (
    <Tabs
      value={value}
      onValueChange={(next) =>
        query.apply({
          status:
            next === "all" ? "" : (next as BranchDirectoryFilters["status"]),
        })
      }
      className="min-w-0 gap-6"
    >
      <div className="min-w-0 border-b">
        <TabsList
          variant="line"
          aria-label="Branch status"
          className="max-w-full flex-wrap justify-start p-0 group-data-horizontal/tabs:h-auto [&>[data-slot=tabs-trigger]]:h-11"
        >
          <TabsTrigger
            value="all"
            className="px-3 data-active:text-primary data-active:after:bg-primary"
          >
            All branches
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="px-3 data-active:text-primary data-active:after:bg-primary"
          >
            Active
          </TabsTrigger>
          <TabsTrigger
            value="inactive"
            className="px-3 data-active:text-primary data-active:after:bg-primary"
          >
            Inactive
          </TabsTrigger>
        </TabsList>
      </div>
      <form
        aria-label="Filter branches"
        aria-busy={query.pending}
        className="flex min-w-0 flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          query.flushSearch();
        }}
      >
        <FieldGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-9 xl:[&>[data-slot=field]:not(:first-child)]:col-span-2 [&_[data-slot=field]]:w-full [&_[data-slot=input-group]]:h-11 sm:[&_[data-slot=input-group]]:h-10 [&_[data-slot=select-trigger]]:data-[size=default]:h-11 sm:[&_[data-slot=select-trigger]]:data-[size=default]:h-10">
          <Field className="min-w-0 sm:col-span-2 xl:col-span-5">
            <FieldLabel htmlFor="branch-search">Search branches</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="branch-search"
                type="search"
                placeholder="Search by branch name…"
                maxLength={100}
                value={query.search}
                onChange={(event) => query.changeSearch(event.target.value)}
              />
              <InputGroupAddon>
                {query.pending ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <Search aria-hidden="true" />
                )}
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <DirectorySelect
            id="branch-service"
            label="Service"
            value={filters.service_type || "all"}
            options={[
              { value: "all", label: "All services" },
              { value: "DINE_IN", label: "Dine-in" },
              { value: "TAKEAWAY", label: "Takeout" },
            ]}
            onChange={(next) =>
              query.apply({
                service_type:
                  next === "all"
                    ? ""
                    : (next as BranchDirectoryFilters["service_type"]),
              })
            }
          />
          <DirectorySelect
            id="branch-sort"
            label="Sort by"
            value={filters.sort}
            options={[
              { value: "name_asc", label: "Name A–Z" },
              { value: "name_desc", label: "Name Z–A" },
              { value: "opened_desc", label: "Recently opened" },
              { value: "opened_asc", label: "Earliest opened" },
            ]}
            onChange={(next) =>
              query.apply({ sort: next as BranchDirectoryFilters["sort"] })
            }
          />
        </FieldGroup>
        {active && (
          <div
            aria-label="Active filters"
            className="flex flex-wrap items-center gap-2"
          >
            {filters.search && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  query.changeSearch("");
                  query.apply({ search: "" });
                }}
              >
                Search: {filters.search}
                <X aria-hidden="true" data-icon="inline-end" />
              </Button>
            )}
            {filters.status && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Remove status filter"
                onClick={() => query.apply({ status: "" })}
              >
                Status: {filters.status === "active" ? "Active" : "Inactive"}
                <X aria-hidden="true" data-icon="inline-end" />
              </Button>
            )}
            {filters.service_type && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Remove service filter"
                onClick={() => query.apply({ service_type: "" })}
              >
                Service:{" "}
                {filters.service_type === "DINE_IN" ? "Dine-in" : "Takeout"}
                <X aria-hidden="true" data-icon="inline-end" />
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              Clear all
            </Button>
          </div>
        )}
        <span role="status" className="sr-only">
          {query.pending
            ? "Updating branches…"
            : "Search updates as you type. Filters and sorting apply immediately."}
        </span>
      </form>
      <TabsContent
        value={value}
        aria-busy={query.pending}
        className="flex min-w-0 flex-col gap-4"
      >
        {children}
      </TabsContent>
    </Tabs>
  );
}
