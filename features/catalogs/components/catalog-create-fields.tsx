import { SupplierCreateFields } from "./supplier-create-fields";
import { StockItemCreateFields } from "@/features/stock-items/components/stock-item-create-fields";
import { PaymentMethodEditorFields } from "@/features/payment-methods/components/payment-method-editor-fields";
import type { CatalogFieldDefinition } from "../types/catalog.types";
export function CatalogCreateFields({
  layout,
  fields,
  values,
  pending,
  onChange,
}: {
  layout: "supplier" | "stock-item" | "payment-method";
  fields: CatalogFieldDefinition[];
  values: Record<string, string>;
  pending: boolean;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
      {layout === "payment-method" ? (
        <PaymentMethodEditorFields
          values={values}
          pending={pending}
          onChange={onChange}
        />
      ) : layout === "supplier" ? (
        <SupplierCreateFields
          fields={fields}
          values={values}
          pending={pending}
          onChange={onChange}
        />
      ) : (
        <StockItemCreateFields
          fields={fields}
          values={values}
          pending={pending}
          onChange={onChange}
        />
      )}
    </div>
  );
}
