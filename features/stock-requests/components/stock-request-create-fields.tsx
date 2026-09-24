import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Branch } from "@/features/branches/types/branch.types";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import {
  StockRequestLineFields,
  type StockRequestLineValue,
} from "./stock-request-line-fields";

export function StockRequestCreateFields({
  branches,
  stockItems,
  branchId,
  lines,
  pending,
  error,
  onBranchChange,
  onLineChange,
  onLineRemove,
  onAddLine,
}: {
  branches: Branch[];
  stockItems: StockItem[];
  branchId: string;
  lines: StockRequestLineValue[];
  pending: boolean;
  error: string;
  onBranchChange: (branchId: string) => void;
  onLineChange: (
    key: number,
    field: "stock_item_id" | "quantity_requested",
    value: string,
  ) => void;
  onLineRemove: (key: number) => void;
  onAddLine: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="request-branch">Branch</FieldLabel>
          <Select
            value={branchId}
            disabled={pending || branches.length === 1}
            onValueChange={(value) => onBranchChange(value ?? "")}
          >
            <SelectTrigger id="request-branch" className="w-full">
              <SelectValue>
                {(value: unknown) =>
                  branches.find((branch) => branch.id === value)?.branch_name ??
                  "Select a branch"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent data-coms-ui="operational">
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.branch_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {branches.length === 1 && (
            <FieldDescription>
              This request will be submitted for your assigned branch.
            </FieldDescription>
          )}
        </Field>
      </FieldGroup>
      <StockRequestLineFields
        lines={lines}
        stockItems={stockItems}
        disabled={pending}
        onChange={onLineChange}
        onRemove={onLineRemove}
      />
      <Button
        type="button"
        variant="outline"
        disabled={
          pending || lines.length >= 100 || stockItems.length <= lines.length
        }
        onClick={onAddLine}
      >
        Add stock item
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Requests record demand only. Inventory changes after an approved
        dispatch is posted.
      </p>
    </div>
  );
}
