"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import type { Permission } from "@/features/roles/types/role.types";

type Props = {
  permissions: Permission[];
  selected: string[];
  disabled: boolean;
  onChange: (keys: string[]) => void;
  idPrefix: string;
  labelPrefix: string;
};

export function RolePermissionPicker({
  permissions,
  selected,
  disabled,
  onChange,
  idPrefix,
  labelPrefix,
}: Props) {
  const [search, setSearch] = useState("");
  const grouped = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return permissions.reduce<Record<string, Permission[]>>(
      (result, permission) => {
        if (
          !needle ||
          `${permission.key} ${permission.description}`
            .toLowerCase()
            .includes(needle)
        ) {
          (result[permission.module_key] ??= []).push(permission);
        }
        return result;
      },
      {},
    );
  }, [permissions, search]);
  const counts = useMemo(
    () =>
      permissions.reduce<Record<string, number>>((result, permission) => {
        result[permission.module_key] =
          (result[permission.module_key] ?? 0) + 1;
        return result;
      }, {}),
    [permissions],
  );

  function toggle(key: string, checked: boolean) {
    onChange(
      checked
        ? [...new Set([...selected, key])]
        : selected.filter((permission) => permission !== key),
    );
  }

  return (
    <FieldSet className="flex h-full min-h-0 flex-col gap-4">
      <FieldLegend className="sr-only">Permissions</FieldLegend>
      <div className="relative shrink-0">
        <FieldLabel
          htmlFor={`${idPrefix}-permission-search`}
          className="sr-only"
        >
          Search permissions
        </FieldLabel>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={`${idPrefix}-permission-search`}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Search permissions..."
          className="pl-9"
        />
      </div>
      <ScrollArea
        role="region"
        aria-label="Permission groups"
        className="min-h-0 min-w-0 w-full flex-1 rounded-md [&_[data-slot=scroll-area-viewport]]:overflow-x-hidden"
      >
        {permissions.length === 0 ? (
          <OperationalEmptyState
            title="No permissions available"
            description="The permission catalog could not be loaded for this role."
          />
        ) : Object.keys(grouped).length === 0 ? (
          <p role="status" className="p-3 text-sm text-muted-foreground">
            No permissions match this search.
          </p>
        ) : (
          <FieldGroup className="gap-3 pb-1">
            {Object.entries(grouped).map(([module, items]) => {
              const moduleLabel = module.replaceAll("_", " ");
              const selectedCount = permissions.filter(
                (permission) =>
                  permission.module_key === module &&
                  selected.includes(permission.key),
              ).length;
              return (
                <Collapsible key={module} defaultOpen>
                  <FieldSet className="gap-0 overflow-hidden rounded-md border">
                    <FieldLegend className="sr-only capitalize">
                      {moduleLabel}
                    </FieldLegend>
                    <CollapsibleTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          aria-label={`${moduleLabel} permissions`}
                          className="group w-full justify-between rounded-none px-3 py-2 text-left hover:bg-muted/50"
                        />
                      }
                    >
                      <span className="flex min-w-0 items-center gap-2 font-semibold capitalize">
                        <ChevronDown
                          aria-hidden="true"
                          className="size-4 shrink-0 -rotate-90 transition-transform group-aria-expanded:rotate-0"
                        />
                        {moduleLabel}
                      </span>
                      <span className="shrink-0 text-sm font-normal text-muted-foreground">
                        {selectedCount} of {counts[module]} selected
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <FieldGroup className="gap-0">
                        {items.map((permission) => {
                          const id = `${idPrefix}-${permission.key}-checkbox`;
                          return (
                            <Field
                              key={permission.key}
                              orientation="horizontal"
                              className="min-w-0 items-start gap-3 border-t px-3 py-2.5 hover:bg-muted/30"
                            >
                              <Checkbox
                                id={id}
                                aria-labelledby={`${id}-label`}
                                disabled={disabled}
                                checked={selected.includes(permission.key)}
                                onCheckedChange={(checked) =>
                                  toggle(permission.key, checked === true)
                                }
                                className="mt-0.5"
                              />
                              <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] sm:items-center sm:gap-4">
                                <FieldLabel
                                  id={`${id}-label`}
                                  htmlFor={id}
                                  className="min-w-0 font-normal capitalize"
                                >
                                  <span className="sr-only">
                                    {labelPrefix} {permission.key}{" "}
                                  </span>
                                  {permission.action_key.replaceAll("_", " ")}
                                </FieldLabel>
                                <FieldDescription className="min-w-0 text-xs sm:text-sm">
                                  {permission.description}
                                </FieldDescription>
                              </div>
                            </Field>
                          );
                        })}
                      </FieldGroup>
                    </CollapsibleContent>
                  </FieldSet>
                </Collapsible>
              );
            })}
          </FieldGroup>
        )}
      </ScrollArea>
    </FieldSet>
  );
}
