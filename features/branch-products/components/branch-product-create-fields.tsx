import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BranchProductProductOption } from "@/features/branch-products/types/branch-product.types";

export function BranchProductCreateFields({
  products,
  productId,
  price,
  pending,
  onProductChange,
  onPriceChange,
}: {
  products: BranchProductProductOption[];
  productId: string;
  price: string;
  pending: boolean;
  onProductChange: (productId: string) => void;
  onPriceChange: (price: string) => void;
}) {
  return (
    <FieldGroup className="gap-4">
      <Field>
        <FieldLabel htmlFor="branch-product-choice">
          Product <span className="text-destructive">*</span>
        </FieldLabel>
        <Select
          items={products.map((product) => ({
            value: product.id,
            label: product.product_name,
          }))}
          value={productId || null}
          disabled={pending}
          onValueChange={(value) => onProductChange(value ?? "")}
        >
          <SelectTrigger id="branch-product-choice" className="w-full">
            <SelectValue placeholder="Choose a product" />
          </SelectTrigger>
          <SelectContent data-coms-ui="operational">
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.product_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="branch-product-price">
          Offer price <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="branch-product-price"
          inputMode="decimal"
          autoComplete="off"
          maxLength={80}
          value={price}
          disabled={pending}
          onChange={(event) => onPriceChange(event.target.value)}
          placeholder="For example, 125.00"
        />
      </Field>
    </FieldGroup>
  );
}
