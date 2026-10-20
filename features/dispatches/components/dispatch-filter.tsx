"use client";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { DirectorySelect } from "@/components/shared/directory-select";
import type { useDirectoryQuery } from "@/hooks/use-directory-query";
import {
  createDispatchHref,
  type DispatchPageFilters,
  type DispatchStatusFilter,
  type DispatchDiscrepancyFilter,
} from "../services/dispatch-page-params";
import { dispatchStatusLabel } from "./dispatch-status-badge";
import {
  dispatchStatusOptions,
  dispatchDiscrepancyOptions,
  dispatchSortOptionsWithIcons,
} from "./dispatch-filter-options";

export function DispatchFilter({
  filters,
  query,
}: {
  filters: DispatchPageFilters;
  query: ReturnType<typeof useDirectoryQuery<DispatchPageFilters>>;
}) {
  const { search, pending, changeSearch, flushSearch, apply } = query;
  const active = Boolean(
    filters.branchId ||
    filters.search ||
    filters.status !== "all" ||
    filters.discrepancyStatus !== "all",
  );
  return (
    <form
      action="/dispatches"
      aria-label="Filter dispatches"
      className="flex min-w-0 flex-col gap-3 [&_[data-slot=select-trigger]]:h-10 [&_[data-slot=select-trigger]]:px-3 [&_[data-slot=select-trigger]]:text-sm"
      onSubmit={(event) => {
        event.preventDefault();
        flushSearch();
      }}
    >
      <FieldGroup className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-row xl:items-end">
        <Field className="min-w-0 sm:col-span-2 xl:flex-1">
          <FieldLabel className="sr-only" htmlFor="dispatch-search">
            Search branch
          </FieldLabel>
          <InputGroup className="h-10">
            <InputGroupInput
              id="dispatch-search"
              type="search"
              className="h-full text-base md:text-sm"
              maxLength={100}
              value={search}
              placeholder="Search branch"
              onChange={(event) => changeSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  flushSearch();
                }
              }}
            />
            <InputGroupAddon className="pl-3">
              <Search aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        {!filters.receivingStatus && (
          <DirectorySelect
            id="dispatch-status"
            alignItemWithTrigger={false}
            label="Dispatch status"
            hideLabel
            className="sm:w-full xl:w-60"
            value={filters.status}
            options={dispatchStatusOptions}
            onChange={(status) =>
              apply({ status: status as DispatchStatusFilter })
            }
          />
        )}
        <DirectorySelect
          id="dispatch-discrepancy-status"
          alignItemWithTrigger={false}
          label="Discrepancy"
          hideLabel
          className="sm:w-full xl:w-56"
          value={filters.discrepancyStatus}
          options={dispatchDiscrepancyOptions}
          onChange={(discrepancyStatus) =>
            apply({
              discrepancyStatus: discrepancyStatus as DispatchDiscrepancyFilter,
            })
          }
        />
        <DirectorySelect
          id="dispatch-sort"
          alignItemWithTrigger={false}
          label="Sort by"
          hideLabel
          className="sm:w-full xl:w-44"
          value={filters.sort ?? "newest"}
          options={dispatchSortOptionsWithIcons}
          onChange={(sort) => apply({ sort })}
        />
      </FieldGroup>
      {active && (
        <div
          aria-label="Active dispatch filters"
          className="flex flex-wrap items-center gap-2"
        >
          {filters.branchId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Clear branch filter"
              onClick={() => apply({ branchId: undefined })}
            >
              Selected branch
              <X aria-hidden="true" />
            </Button>
          )}
          {(["search", "status", "discrepancyStatus"] as const)
            .filter((key) => filters[key] && filters[key] !== "all")
            .map((key) => (
              <Link
                key={key}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "h-auto max-w-full whitespace-normal text-left",
                })}
                href={createDispatchHref({
                  ...filters,
                  page: 1,
                  [key]: key === "search" ? "" : "all",
                })}
                onClick={(event) => {
                  event.preventDefault();
                  if (key === "search") changeSearch("");
                  apply({ [key]: key === "search" ? "" : "all" });
                }}
                aria-label={`Clear ${key === "search" ? "branch search" : key === "status" ? "dispatch status" : "discrepancy filter"}`}
              >
                <span className="min-w-0 break-words">
                  {key === "search"
                    ? `Branch: ${filters.search}`
                    : `${key === "status" ? "Status" : "Discrepancy"}: ${filters[key] === "NONE" ? "None" : dispatchStatusLabel(filters[key]!)}`}
                </span>
                <X aria-hidden="true" data-icon="inline-end" />
              </Link>
            ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              changeSearch("");
              apply({
                branchId: undefined,
                search: "",
                status: "all",
                discrepancyStatus: "all",
                sort: "newest",
              });
            }}
          >
            Clear all
          </Button>
        </div>
      )}
      <span role="status" className="sr-only">
        {pending ? "Updating dispatches…" : "Search updates as you type."}
      </span>
    </form>
  );
}
