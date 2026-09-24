"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import type { Permission } from "@/features/roles/types/role.types";

export function PermissionPicker({
  permissions,
  selected,
  labelPrefix,
  onChange,
  disabled = false,
}: {
  permissions: Permission[];
  selected: string[];
  labelPrefix: string;
  onChange: (keys: string[]) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const idPrefix = labelPrefix.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  const groups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return permissions.reduce<Record<string, Permission[]>>((result, item) => {
      if (
        !needle ||
        `${item.key} ${item.description}`.toLowerCase().includes(needle)
      ) {
        (result[item.module_key] ??= []).push(item);
      }
      return result;
    }, {});
  }, [permissions, search]);
  const allGroups = useMemo(
    () =>
      permissions.reduce<Record<string, Permission[]>>((result, permission) => {
        (result[permission.module_key] ??= []).push(permission);
        return result;
      }, {}),
    [permissions],
  );

  function togglePermission(key: string, checked: boolean) {
    onChange(
      checked
        ? [...new Set([...selected, key])]
        : selected.filter((item) => item !== key),
    );
  }

  if (permissions.length === 0) {
    return (
      <FieldSet>
        <FieldLegend variant="label">Permissions</FieldLegend>
        <OperationalEmptyState
          title="No permissions available"
          description="The permission catalog could not be loaded for this role."
        />
      </FieldSet>
    );
  }

  return (
    <FieldSet className="gap-4">
      <FieldLegend variant="label">Permissions</FieldLegend>
      <Field>
        <FieldLabel htmlFor={`${labelPrefix}-permission-search`}>
          Search permissions
        </FieldLabel>
        <Input
          id={`${labelPrefix}-permission-search`}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Search actions or descriptions"
        />
        <FieldDescription>
          Selected grants stay selected when they are filtered from view.
        </FieldDescription>
      </Field>

      {Object.keys(groups).length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          No permissions match this search.
        </p>
      ) : (
        <FieldGroup className="gap-3">
          {Object.entries(groups).map(([module, items]) => {
            const allItems = allGroups[module] ?? [];
            const selectedCount = allItems.filter((item) =>
              selected.includes(item.key),
            ).length;
            return (
              <Collapsible key={module} defaultOpen>
                <FieldSet className="rounded-lg border p-3">
                  <FieldLegend variant="label" className="mb-0 capitalize">
                    {module.replaceAll("_", " ")}
                  </FieldLegend>
                  <div className="flex items-center justify-end">
                    <CollapsibleTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`${module.replaceAll("_", " ")} permissions`}
                        />
                      }
                    >
                      <Badge variant="outline">
                        {selectedCount}/{allItems.length} selected
                      </Badge>
                      <ChevronDown aria-hidden="true" />
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <FieldGroup className="gap-1 pt-2">
                      {items.map((permission) => (
                        <Field
                          key={permission.key}
                          orientation="horizontal"
                          className="items-start rounded-md px-2 py-2 hover:bg-muted/50"
                        >
                          <Checkbox
                            id={`${idPrefix}-${permission.key}-checkbox`}
                            aria-labelledby={`${idPrefix}-${permission.key}-label`}
                            disabled={disabled}
                            checked={selected.includes(permission.key)}
                            onCheckedChange={(checked) =>
                              togglePermission(permission.key, checked === true)
                            }
                          />
                          <div className="grid gap-0.5">
                            <FieldLabel
                              id={`${idPrefix}-${permission.key}-label`}
                              htmlFor={`${idPrefix}-${permission.key}-checkbox`}
                              className="font-medium capitalize"
                            >
                              <span className="sr-only">
                                {labelPrefix} {permission.key}{" "}
                              </span>
                              {permission.action_key.replaceAll("_", " ")}
                            </FieldLabel>
                            <FieldDescription>
                              {permission.description}
                            </FieldDescription>
                          </div>
                        </Field>
                      ))}
                    </FieldGroup>
                  </CollapsibleContent>
                </FieldSet>
              </Collapsible>
            );
          })}
        </FieldGroup>
      )}
    </FieldSet>
  );
}
