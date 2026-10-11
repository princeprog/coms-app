import type { CatalogRecord } from "../types/catalog.types";
export function dialogDescription(
  resourceName: string,
  record: CatalogRecord | null,
  createLayout: "supplier" | "stock-item" | "payment-method" | null,
) {
  if (record) return `Update the saved ${resourceName} details.`;
  if (createLayout === "payment-method")
    return "Choose how this method behaves at checkout and whether it is available now.";
  if (createLayout === "supplier")
    return "Add a supplier for commissary receiving. Contact details can be added now or later.";
  if (createLayout === "stock-item")
    return "Define an item and the unit used to track its stock across COMS.";
  return `Add a new ${resourceName} to the catalog.`;
}
