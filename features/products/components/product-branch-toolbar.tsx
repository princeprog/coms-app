"use client";
import { ListChecks, ListX, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export function ProductBranchToolbar({
  search,
  onSearch,
  disabled,
  multiplePages,
  pageSelected,
  canSelect,
  onTogglePage,
}: {
  search: string;
  onSearch: (value: string) => void;
  disabled: boolean;
  multiplePages: boolean;
  pageSelected: boolean;
  canSelect: boolean;
  onTogglePage: () => void;
}) {
  const Icon = pageSelected ? ListX : ListChecks;
  const label = pageSelected
    ? multiplePages
      ? "Clear this page"
      : "Deselect all"
    : multiplePages
      ? "Select this page"
      : "Select all";
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Field className="min-w-0 flex-1">
        <FieldLabel htmlFor="product-branch-search" className="sr-only">
          Search branches
        </FieldLabel>
        <InputGroup className="h-10">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id="product-branch-search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
            placeholder="Search branches..."
            maxLength={100}
            disabled={disabled}
          />
        </InputGroup>
      </Field>
      <Button
        type="button"
        variant="outline"
        className="h-10 px-4"
        disabled={disabled || !canSelect}
        onClick={onTogglePage}
      >
        <Icon aria-hidden="true" />
        {label}
      </Button>
    </div>
  );
}
