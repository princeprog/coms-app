import type {
  CatalogDisplayColumn,
  CatalogFieldDefinition,
} from "@/features/catalogs/types/catalog.types";

export const productsEndpoint = "/products";

export const productDisplayColumns: CatalogDisplayColumn[] = [
  { key: "product_name", label: "Product" },
  { key: "description", label: "Description" },
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
];
