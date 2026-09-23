import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createInventoryHref } from "@/features/inventory/services/inventory-page-params";
import type { InventoryBranchOption } from "@/features/inventory/types/inventory.types";

export function InventoryScopeFilter({
  scope,
  branchOptions,
  selectedBranchId,
  search,
}: {
  scope: "COMMISSARY" | "BRANCH";
  branchOptions: InventoryBranchOption[];
  selectedBranchId?: string;
  search: string;
}) {
  const firstBranchId = selectedBranchId ?? branchOptions[0]?.id;
  return (
    <section
      aria-label="Inventory scope and filters"
      className="flex flex-col gap-4 rounded-4xl border bg-card p-4"
    >
      <nav aria-label="Inventory scope" className="flex flex-wrap gap-2">
        <Link
          className={buttonVariants({
            variant: scope === "COMMISSARY" ? "default" : "outline",
          })}
          href={createInventoryHref({
            scope: "COMMISSARY",
            page: 1,
            search,
          })}
          aria-current={scope === "COMMISSARY" ? "page" : undefined}
        >
          Commissary inventory
        </Link>
        <Link
          className={buttonVariants({
            variant: scope === "BRANCH" ? "default" : "outline",
          })}
          href={createInventoryHref({
            scope: "BRANCH",
            branchId: firstBranchId,
            page: 1,
            search,
          })}
          aria-current={scope === "BRANCH" ? "page" : undefined}
        >
          Branch inventory
        </Link>
      </nav>

      <form
        action="/inventory"
        method="get"
        className="grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_auto] sm:items-end"
        aria-label="Filter inventory"
      >
        <input type="hidden" name="scope" value={scope} />
        <div className="flex flex-col gap-2">
          <label htmlFor="inventory-search" className="text-sm font-medium">
            Search stock items
          </label>
          <Input
            key={`${scope}-${search}`}
            id="inventory-search"
            name="search"
            type="search"
            maxLength={120}
            defaultValue={search}
          />
        </div>
        {scope === "BRANCH" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="inventory-branch" className="text-sm font-medium">
              Branch
            </label>
            {branchOptions.length > 0 ? (
              <select
                key={selectedBranchId ?? branchOptions[0].id}
                id="inventory-branch"
                name="branch_id"
                defaultValue={selectedBranchId ?? branchOptions[0].id}
                className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                {branchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.status === "inactive"
                      ? `${branch.name} (inactive)`
                      : branch.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="flex h-9 items-center text-sm text-muted-foreground">
                No branch is available to this account.
              </p>
            )}
          </div>
        )}
        <Button type="submit" variant="outline">
          Apply filters
        </Button>
      </form>
    </section>
  );
}
