import type {
  CatalogDisplayColumn,
  CatalogFieldDefinition,
} from "@/features/catalogs/types/catalog.types";

export const stockItemsEndpoint = "/stock-items";

export const stockItemDisplayColumns: CatalogDisplayColumn[] = [
  { key: "stock_item_name", label: "Stock item" },
  { key: "category", label: "Category" },
  { key: "unit", label: "Unit" },
];

export const stockItemFields: CatalogFieldDefinition[] = [
  {
    key: "stock_item_name",
    label: "Stock item name",
    required: true,
    maxLength: 160,
  },
  { key: "category", label: "Category", required: true, maxLength: 80 },
  { key: "unit", label: "Unit", required: true, maxLength: 40 },
];
