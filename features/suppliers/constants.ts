import type {
  CatalogDisplayColumn,
  CatalogFieldDefinition,
} from "@/features/catalogs/types/catalog.types";

export const suppliersEndpoint = "/suppliers";

export const supplierDisplayColumns: CatalogDisplayColumn[] = [
  { key: "supplier_name", label: "Supplier" },
  { key: "contact_person", label: "Contact person" },
  { key: "contact_number", label: "Phone" },
  { key: "email", label: "Email" },
];

export const supplierFields: CatalogFieldDefinition[] = [
  {
    key: "supplier_name",
    label: "Supplier name",
    required: true,
    maxLength: 160,
  },
  {
    key: "contact_person",
    label: "Contact person",
    maxLength: 120,
  },
  {
    key: "contact_number",
    label: "Contact number",
    maxLength: 32,
  },
  { key: "email", label: "Email", type: "email", maxLength: 254 },
  {
    key: "address",
    label: "Address",
    type: "textarea",
    maxLength: 1000,
  },
];
