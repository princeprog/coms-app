"use client";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceType } from "@/features/menus/schemas/menu.schema";
import { formatProductPrice } from "../product-format";
import type { CategoryChoice } from "@/features/product-categories/schemas/product-category.schema";
import { ProductCategorySelector } from "@/features/product-categories/components/product-category-selector";
export function ProductSetupInfo({
  name,
  category,
  onCategory,
  price,
  description,
  services,
  onName,
  onPrice,
  onDescription,
  disabled,
  readOnly = false,
  errors = {},
}: {
  name: string;
  category: CategoryChoice | null;
  onCategory: (category: CategoryChoice) => void;
  price: string;
  description: string;
  services: ServiceType[];
  onName: (v: string) => void;
  onPrice: (v: string) => void;
  onDescription: (v: string) => void;
  disabled: boolean;
  readOnly?: boolean;
  errors?: Record<string, string>;
}) {
  if (readOnly)
    return (
      <dl className="grid gap-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Category</dt>
          <dd className="mt-1 font-medium">
            {category?.name}
            {category && !category.is_active ? " (Archived)" : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Product name</dt>
          <dd className="mt-1 font-medium">{name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Selling price</dt>
          <dd className="mt-1 font-medium tabular-nums">
            {formatProductPrice(price)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Description</dt>
          <dd className="mt-1 whitespace-pre-wrap">
            {description || "No description"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Services</dt>
          <dd className="mt-1">
            {services
              .map((s) => (s === "DINE_IN" ? "Dine-in" : "Takeout"))
              .join(" · ")}
          </dd>
        </div>
      </dl>
    );
  return (
    <FieldGroup>
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.product_name)}>
          <FieldLabel htmlFor="setup-name">
            Product name{" "}
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          </FieldLabel>
          <Input
            id="setup-name"
            aria-label="Product name"
            value={name}
            required
            minLength={2}
            maxLength={160}
            disabled={disabled}
            onChange={(e) => onName(e.target.value)}
            placeholder="e.g. Chicken rice meal"
            className="h-10"
            aria-invalid={Boolean(errors.product_name)}
            aria-describedby={
              errors.product_name ? "setup-name-error" : undefined
            }
          />
          {errors.product_name && (
            <FieldError id="setup-name-error">{errors.product_name}</FieldError>
          )}
        </Field>
        <Field data-invalid={Boolean(errors.price)}>
          <FieldLabel htmlFor="setup-price">
            Selling price{" "}
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          </FieldLabel>
          <InputGroup className="h-10">
            <InputGroupAddon>₱</InputGroupAddon>
            <InputGroupInput
              id="setup-price"
              aria-label="Selling price"
              value={price}
              required
              inputMode="decimal"
              maxLength={80}
              disabled={disabled}
              onChange={(e) => onPrice(e.target.value)}
              placeholder="0.00"
              aria-invalid={Boolean(errors.price)}
              aria-describedby={
                errors.price
                  ? "setup-price-help setup-price-error"
                  : "setup-price-help"
              }
            />
          </InputGroup>
          <FieldDescription id="setup-price-help">
            The same price at every branch.
          </FieldDescription>
          {errors.price && (
            <FieldError id="setup-price-error">{errors.price}</FieldError>
          )}
        </Field>
      </FieldGroup>
      <ProductCategorySelector
        value={category}
        onChange={onCategory}
        disabled={disabled}
        error={errors.category_id}
      />
      <Field>
        <FieldLabel htmlFor="setup-description">
          Description <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Textarea
          id="setup-description"
          value={description}
          maxLength={1000}
          disabled={disabled}
          onChange={(e) => onDescription(e.target.value)}
          placeholder="A short description for your team."
          rows={2}
          className="min-h-16"
        />
      </Field>
    </FieldGroup>
  );
}
