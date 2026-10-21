"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { DatePicker } from "@/components/shared/date-picker";
import { DirectorySelect } from "@/components/shared/directory-select";
import type { AuditQueryState } from "../hooks/use-audit-query";
import { auditAreaOptions } from "./audit-area-options";

export function AuditLogFilters({
  auditQuery,
}: {
  auditQuery: AuditQueryState;
}) {
  const { query, update } = auditQuery;
  const [draft, setDraft] = useState(query.search);
  useEffect(() => {
    if (draft.trim() === query.search) return;
    const timer = setTimeout(() => update({ search: draft.trim() }), 350);
    return () => clearTimeout(timer);
  }, [draft, query.search, update]);
  const filtered = Boolean(
    query.search || query.area || query.from || query.to,
  );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <Field className="min-w-0 flex-1">
          <FieldLabel htmlFor="audit-search">Search</FieldLabel>
          <InputGroup className="h-11">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="audit-search"
              type="search"
              maxLength={100}
              placeholder="Person, record or action"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </InputGroup>
        </Field>
        <DirectorySelect
          id="audit-area"
          label="Area"
          value={query.area ?? "all"}
          alignItemWithTrigger={false}
          className="[&_[data-slot=select-trigger]]:h-11"
          options={auditAreaOptions}
          onChange={(area) =>
            update({ area: area === "all" ? undefined : area })
          }
        />
        <div className="grid grid-cols-2 gap-3 lg:flex lg:items-end">
          <Field className="min-w-0 lg:w-48 lg:shrink-0">
            <FieldLabel htmlFor="audit-from">From</FieldLabel>
            <DatePicker
              id="audit-from"
              label="From"
              value={query.from ?? ""}
              clearable
              className="h-11"
              onChange={(from) => update({ from })}
            />
          </Field>
          <Field className="min-w-0 lg:w-48 lg:shrink-0">
            <FieldLabel htmlFor="audit-to">To</FieldLabel>
            <DatePicker
              id="audit-to"
              label="To"
              value={query.to ?? ""}
              clearable
              className="h-11"
              onChange={(to) => update({ to })}
            />
          </Field>
        </div>
        {filtered && (
          <Button
            type="button"
            variant="ghost"
            className="h-11"
            onClick={() => {
              setDraft("");
              update({
                search: "",
                area: undefined,
                from: undefined,
                to: undefined,
              });
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
      {query.from && query.to && query.from > query.to && (
        <p role="alert" className="text-sm text-destructive">
          The end date must be on or after the start date.
        </p>
      )}
    </div>
  );
}
