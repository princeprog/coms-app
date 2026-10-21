import type {
  CatalogDisplayColumn,
  CatalogFieldDefinition,
} from "@/features/catalogs/types/catalog.types";

export const stockItemsEndpoint = "/stock-items";

// Matches the categories in use; keep new items out of near-duplicates.
export const stockItemCategories = [
  "Meat and poultry",
  "Seafood",
  "Eggs and dairy",
  "Rice and grains",
  "Vegetables and aromatics",
  "Fruit and beverages",
  "Sauces and seasonings",
  "Commissary preparations",
  "Bottled drinks",
  "Packaging",
  "Cleaning supplies",
  "Other",
] as const;

export const stockRecipeUseLabels = {
  RECIPE: "Used in recipes",
  OPERATING_SUPPLY: "Operating supply only",
} as const;

export const stockItemDisplayColumns: CatalogDisplayColumn[] = [
  { key: "stock_item_name", label: "Stock item" },
  { key: "category", label: "Category" },
  { key: "unit", label: "Unit" },
  { key: "recipe_use", label: "Recipe use", valueLabels: stockRecipeUseLabels },
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
  {
    key: "recipe_use",
    label: "Recipe use",
    type: "select",
    required: true,
    defaultValue: "RECIPE",
    options: Object.entries(stockRecipeUseLabels).map(([value, label]) => ({
      value,
      label,
    })),
  },
];
