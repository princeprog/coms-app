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
import { useDirectoryQuery } from "@/hooks/use-directory-query";
import { dispatchStatuses } from "../constants";
import {
  createDispatchHref,
  dispatchSortOptions,
  type DispatchPageFilters,
  type DispatchStatusFilter,
  type DispatchDiscrepancyFilter,
} from "../services/dispatch-page-params";
import { dispatchStatusLabel } from "./dispatch-status-badge";

export function DispatchFilter({ filters }: { filters: DispatchPageFilters }) {
  const { search, pending, changeSearch, flushSearch, apply } =
    useDirectoryQuery(filters, createDispatchHref);
  const active = Boolean(
    filters.search ||
    filters.status !== "all" ||
    filters.discrepancyStatus !== "all",
  );
  return (
    <form
      action="/dispatches"
      aria-label="Filter dispatches"
      className="flex min-w-0 flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        flushSearch();
      }}
    >
      <FieldGroup className="gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <Field className="min-w-0 sm:min-w-48 sm:flex-1">
          <FieldLabel htmlFor="dispatch-search">Search branch</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="dispatch-search"
              type="search"
              maxLength={100}
              value={search}
              placeholder="Search by branch name…"
              onChange={(event) => changeSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  flushSearch();
                }
              }}
            />
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <DirectorySelect
          id="dispatch-sort"
          label="Sort by"
          value={filters.sort ?? "newest"}
          options={dispatchSortOptions}
          onChange={(sort) => apply({ sort })}
        />
      </FieldGroup>
      <FieldGroup className="gap-3 sm:flex-row sm:flex-wrap">
        <DirectorySelect
          id="dispatch-status"
          label="Dispatch status"
          value={filters.status}
          options={[
            { value: "all", label: "All statuses" },
            ...dispatchStatuses.map((value) => ({
              value,
              label: dispatchStatusLabel(value),
            })),
          ]}
          onChange={(status) =>
            apply({ status: status as DispatchStatusFilter })
          }
        />
        <DirectorySelect
          id="dispatch-discrepancy-status"
          label="Discrepancy"
          value={filters.discrepancyStatus}
          options={[
            { value: "all", label: "All discrepancies" },
            { value: "NONE", label: "No discrepancy" },
            ...["OPEN", "RECOUNT_REQUESTED", "RESOLVED"].map((value) => ({
              value,
              label: dispatchStatusLabel(value),
            })),
          ]}
          onChange={(discrepancyStatus) =>
            apply({
              discrepancyStatus: discrepancyStatus as DispatchDiscrepancyFilter,
            })
          }
        />
      </FieldGroup>
      {active && (
        <div
          aria-label="Active dispatch filters"
          className="flex flex-wrap items-center gap-2"
        >
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
      <span role="status" className="text-xs text-muted-foreground">
        {pending ? "Updating dispatches…" : "Search updates as you type."}
      </span>
    </form>
  );
}
