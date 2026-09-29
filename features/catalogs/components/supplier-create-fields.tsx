import { CatalogCreateField } from "@/features/catalogs/components/catalog-create-field";
import type { CatalogFieldDefinition } from "@/features/catalogs/types/catalog.types";

export function SupplierCreateFields({
  fields,
  values,
  pending,
  onChange,
}: {
  fields: CatalogFieldDefinition[];
  values: Record<string, string>;
  pending: boolean;
  onChange: (key: string, value: string) => void;
}) {
  const byKey = Object.fromEntries(fields.map((field) => [field.key, field]));
  const renderField = (key: string, placeholder: string) => {
    const field = byKey[key] as CatalogFieldDefinition | undefined;
    return field ? (
      <CatalogCreateField
        key={key}
        field={field}
        value={values[key] ?? ""}
        pending={pending}
        placeholder={placeholder}
        onChange={onChange}
      />
    ) : null;
  };

  return (
    <div className="space-y-7">
      <section aria-labelledby="supplier-create-details" className="space-y-4">
        <h3
          id="supplier-create-details"
          className="border-b pb-2 text-sm font-semibold"
        >
          Supplier details
        </h3>
        {renderField("supplier_name", "Enter supplier name")}
      </section>
      <section aria-labelledby="supplier-create-contact" className="space-y-4">
        <h3
          id="supplier-create-contact"
          className="border-b pb-2 text-sm font-semibold"
        >
          Contact information{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {renderField("contact_person", "Full name")}
          {renderField("contact_number", "Phone number")}
        </div>
        {renderField("email", "name@example.com")}
        {renderField("address", "Street, city, province")}
      </section>
    </div>
  );
}
