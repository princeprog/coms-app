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
          ? `Monitor stock levels and recent changes for ${branchName}.`
          : "Monitor stock levels and review recent changes across your locations."}
      </p>
    </section>
  );
}
