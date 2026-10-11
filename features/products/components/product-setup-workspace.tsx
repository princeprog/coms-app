"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { UnsavedNavigationGuard } from "@/components/shared/unsaved-navigation-guard";
import { useProductSetup } from "../hooks/use-product-setup";
import type {
  ProductSetup,
  SetupBranch,
} from "../schemas/product-setup.schema";
import { ProductSetupInfo } from "./product-setup-info";
import { ProductBranchSelection } from "./product-branch-selection";
import { ProductServiceOptions } from "./product-service-options";
import { ProductSetupFooter } from "./product-setup-footer";
export function ProductSetupWorkspace({
  initial,
  canManage,
  branches,
  branchesTotal = branches.length,
  canEdit = false,
}: {
  initial: ProductSetup | null;
  canManage: boolean;
  branches: SetupBranch[];
  branchesTotal?: number;
  canEdit?: boolean;
}) {
  const draft = useProductSetup(initial);
  const editable = canManage && (initial?.product.is_active ?? true);
  const readOnly = !editable;
  const Heading = readOnly ? "h2" : "h1";
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (editable && !draft.pending) draft.save();
      }}
      className="flex w-full min-w-0 max-w-6xl flex-col gap-7"
      data-coms-ui="operational"
    >
      <UnsavedNavigationGuard
        dirty={editable && draft.dirty}
        pending={draft.pending}
      />
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          {readOnly && (
            <Link
              href="/products"
              className="flex w-fit items-center gap-2 text-sm text-muted-foreground"
            >
              <ArrowLeft className="size-4" />
              Products
            </Link>
          )}
          <Heading className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {initial
              ? readOnly
                ? initial.product.product_name
                : "Edit product"
              : "Create product"}
          </Heading>
          <p className="text-sm text-muted-foreground">
            {readOnly
              ? "Product details and availability at your authorized branches."
              : "Set one selling price and choose where this product is available."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && initial?.product.is_active && (
            <Link
              className={buttonVariants()}
              href={`/products/${initial.product.id}/setup`}
            >
              Edit product
            </Link>
          )}
          {readOnly && (
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/branch-products"
            >
              Branch Menu
            </Link>
          )}
        </div>
      </header>
      {initial && !initial.product.is_active && (
        <Alert>
          <AlertTitle>Inactive product</AlertTitle>
          <AlertDescription>
            This product is no longer available for new sales. Its history is
            preserved.
          </AlertDescription>
        </Alert>
      )}
      {draft.error && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Product could not be saved</AlertTitle>
          <AlertDescription>
            {draft.error} Your draft is preserved.
            {initial && (
              <Button
                type="button"
                variant="link"
                onClick={() =>
                  window.open(
                    `/products/${initial.product.id}`,
                    "_blank",
                    "noopener",
                  )
                }
              >
                Review saved product
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      <FieldGroup className="gap-6">
        <FieldSet className="gap-4">
          <FieldLegend className="mb-2 font-semibold data-[variant=legend]:text-xl">
            Product details
          </FieldLegend>
          <ProductSetupInfo
            name={draft.name}
            price={draft.price}
            description={draft.description}
            services={draft.services}
            onName={draft.setName}
            onPrice={draft.setPrice}
            onDescription={draft.setDescription}
            disabled={draft.pending}
            readOnly={readOnly}
            errors={draft.fieldErrors}
          />
        </FieldSet>
        {!readOnly && (
          <>
            <Separator />
            <ProductServiceOptions
              value={draft.services}
              onChange={draft.setServices}
              disabled={draft.pending}
              error={draft.fieldErrors.service_types}
            />
          </>
        )}
        <Separator />
        <ProductBranchSelection
          branches={branches}
          total={branchesTotal}
          value={draft.branchIds}
          onChange={draft.setBranchIds}
          services={draft.services}
          disabled={draft.pending}
          readOnly={readOnly}
        />
      </FieldGroup>
      {editable && (
        <ProductSetupFooter
          pending={draft.pending}
          dirty={draft.dirty}
          isNew={!initial}
        />
      )}
    </form>
  );
}
