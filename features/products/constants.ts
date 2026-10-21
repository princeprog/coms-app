import type {
  CatalogDisplayColumn,
  CatalogFieldDefinition,
} from "@/features/catalogs/types/catalog.types";

export const productsEndpoint = "/products";
export const productSetupEndpoint = (id?: string) =>
  id ? `/products/${id}/setup` : "/products/setup";

export const productDisplayColumns: CatalogDisplayColumn[] = [
  { key: "product_name", label: "Product" },
  { key: "category_name", label: "Category" },
  { key: "price", label: "Selling price", format: "currency" },
  { key: "recipe_summary", label: "Recipe" },
];

export const productFields: CatalogFieldDefinition[] = [
  {
    key: "product_name",
    label: "Product name",
    required: true,
    maxLength: 160,
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    maxLength: 1000,
  },
  {
    key: "service_types",
    label: "Permitted service types",
    type: "choices",
    required: true,
    defaultValue: "DINE_IN,TAKEAWAY",
    options: [
      { value: "DINE_IN", label: "Dine-in" },
      { value: "TAKEAWAY", label: "Takeout" },
    ],
  },
];
