export function InventoryPageHeading({
  isAssignedBranchView,
  selectedBranchId,
  branchName,
}: {
  isAssignedBranchView: boolean;
  selectedBranchId?: string;
  branchName: string;
}) {
  return (
    <section
      aria-labelledby="inventory-page-heading"
      className="flex flex-col gap-1"
    >
      <h2
        id="inventory-page-heading"
        className="text-2xl font-semibold tracking-tight"
      >
        Inventory
      </h2>
      <p className="text-sm text-muted-foreground">
        {isAssignedBranchView && selectedBranchId
          ? `Stock balances and recent movements for ${branchName}.`
          : "Review stock balances and the ledger of receipts, transfers, sales, and adjustments."}
      </p>
    </section>
  );
}
