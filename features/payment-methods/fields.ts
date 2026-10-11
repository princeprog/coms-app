import type {
  CatalogFieldDefinition,
  CatalogDisplayColumn,
} from "@/features/catalogs/types/catalog.types";
export const paymentMethodFields: CatalogFieldDefinition[] = [
  { key: "name", label: "Payment method name", required: true, maxLength: 40 },
  {
    key: "kind",
    label: "Payment type",
    type: "select",
    required: true,
    defaultValue: "NON_CASH",
    options: [
      { value: "CASH", label: "Cash — calculate change" },
      { value: "NON_CASH", label: "Non-cash — no change calculation" },
    ],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    required: true,
    defaultValue: "enabled",
    options: [
      { value: "enabled", label: "Active" },
      { value: "disabled", label: "Inactive" },
    ],
  },
];
export const paymentMethodDisplayColumns: CatalogDisplayColumn[] = [
  { key: "name", label: "Payment method" },
  {
    key: "kind",
    label: "Payment type",
    valueLabels: { CASH: "Cash", NON_CASH: "Non-cash" },
  },
];
