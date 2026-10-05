"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { DirectorySelect } from "@/components/shared/directory-select";
import { useDirectoryQuery } from "@/hooks/use-directory-query";
import {
  createSupplierReceiptHref,
  receiptSortOptions,
  type SupplierReceiptPageFilters,
} from "../services/supplier-receipt-page-params";
import { SupplierReceiptRangeFilters } from "./supplier-receipt-range-filters";

export function SupplierReceiptFilter({
  filters,
}: {
  filters: SupplierReceiptPageFilters;
}) {
  const { search, pending, changeSearch, flushSearch, apply } =
    useDirectoryQuery(filters, createSupplierReceiptHref);
  const [expanded, setExpanded] = useState(false);
  const labels = {
    search: "Supplier",
    received_from: "Delivery from",
    received_to: "Delivery to",
    min_cost: "Minimum cost",
    max_cost: "Maximum cost",
  };
  const active = (Object.keys(labels) as Array<keyof typeof labels>).filter(
    (key) => filters[key],
  );
  return (
    <form
      action="/receipts"
      aria-label="Filter supplier receipts"
      className="flex min-w-0 flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        flushSearch();
      }}
    >
      <FieldGroup className="gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <Field className="min-w-0 sm:min-w-48 sm:flex-1">
          <FieldLabel htmlFor="receipt-search">Search supplier</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="receipt-search"
              type="search"
              maxLength={100}
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  flushSearch();
                }
              }}
              placeholder="Search by supplier name…"
            />
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <DirectorySelect
          id="receipt-sort"
          label="Sort by"
          value={filters.sort ?? "newest"}
          options={receiptSortOptions}
          onChange={(sort) => apply({ sort })}
        />
        <Button
          type="button"
          variant="outline"
          aria-expanded={expanded}
          aria-controls="delivery-range-filters"
          onClick={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal data-icon="inline-start" />
          Filters
          {active.length > (filters.search ? 1 : 0)
            ? ` (${active.length - (filters.search ? 1 : 0)})`
            : ""}
        </Button>
      </FieldGroup>
      {expanded && (
        <div id="delivery-range-filters">
          <SupplierReceiptRangeFilters
            key={JSON.stringify(filters)}
            filters={filters}
            onChange={apply}
          />
        </div>
      )}
      {active.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="Active supplier filters"
        >
          {active.map((key) => (
            <Link
              key={key}
              href={createSupplierReceiptHref({
                ...filters,
                page: 1,
                [key]: "",
              })}
              aria-label={
                key === "search"
                  ? "Clear supplier search"
                  : `Clear ${labels[key].toLowerCase()}`
              }
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "h-auto max-w-full whitespace-normal text-left",
              })}
              onClick={(event) => {
                event.preventDefault();
                if (key === "search") changeSearch("");
                apply({ [key]: "" });
              }}
            >
              <span className="min-w-0 break-words">
                {labels[key]}: {filters[key]}
              </span>
              <X aria-hidden="true" data-icon="inline-end" />
            </Link>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              changeSearch("");
              apply({
                search: "",
                received_from: "",
                received_to: "",
                min_cost: "",
                max_cost: "",
                sort: "newest",
              });
            }}
          >
            Clear all
          </Button>
        </div>
      )}
      <span role="status" className="text-xs text-muted-foreground">
        {pending ? "Updating deliveries…" : "Search updates as you type."}
      </span>
    </form>
  );
}
