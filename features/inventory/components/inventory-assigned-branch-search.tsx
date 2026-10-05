"use client";

import Form from "next/form";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export function InventoryAssignedBranchSearch({
  branchId,
  branchName,
  search,
}: {
  branchId: string;
  branchName: string;
  search: string;
}) {
  return (
    <section aria-label="Search assigned branch inventory">
      <Card size="sm" className="py-3">
        <CardContent className="flex flex-wrap items-end justify-between gap-4">
          <Form
            action="/inventory"
            aria-label="Search stock items in assigned branch"
            className="w-full min-w-0 sm:max-w-md"
          >
            <input type="hidden" name="scope" value="BRANCH" />
            <input type="hidden" name="branch_id" value={branchId} />
            <Field className="gap-2">
              <FieldLabel htmlFor="inventory-search">
                Search stock items
              </FieldLabel>
              <InputGroup className="h-9">
                <InputGroupAddon>
                  <Search aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  key={search}
                  id="inventory-search"
                  name="search"
                  type="search"
                  maxLength={120}
                  defaultValue={search}
                  placeholder="Item name or category"
                />
              </InputGroup>
            </Field>
          </Form>
          <p className="text-sm sm:text-right">
            <span className="block text-muted-foreground">
              Showing data for
            </span>
            <span className="font-medium">{branchName}</span>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
