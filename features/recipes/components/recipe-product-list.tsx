import Form from "next/form";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  OperationalEmptyState,
  OperationalPageIntro,
  OperationalPagination,
} from "@/components/shared/operational-page-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductPage } from "@/features/products/types/product.types";

function recipePageHref(page: number, search: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/recipes?${query}` : "/recipes";
}

export function RecipeProductList({
  page,
  search,
}: {
  page: ProductPage;
  search: string;
}) {
  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));

  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6 p-4 sm:p-6">
      <OperationalPageIntro
        description="Choose a product to review its stock-item recipe or configure the first recipe."
        count={`${page.total} active ${page.total === 1 ? "product" : "products"}`}
      />

      <section
        aria-labelledby="recipe-products-heading"
        className="overflow-hidden rounded-lg border bg-card"
      >
        <div className="flex flex-col gap-4 border-b bg-muted/30 px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="recipe-products-heading" className="text-lg font-semibold">
              Product recipes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Page {page.page} of {pageCount}
            </p>
          </div>
          <Form
            action="/recipes"
            role="search"
            className="flex w-full items-end gap-2 sm:max-w-md"
          >
            <div className="grid min-w-0 flex-1 gap-2">
              <Label htmlFor="recipe-product-search">Search products</Label>
              <Input
                id="recipe-product-search"
                name="search"
                maxLength={100}
                defaultValue={search}
                placeholder="Product name"
              />
            </div>
            <Button type="submit">Search</Button>
          </Form>
        </div>

        {page.items.length > 0 ? (
          <Table
            aria-label="Active products available for recipe management"
            containerProps={{
              role: "region",
              "aria-label": "Recipe product table",
              tabIndex: 0,
            }}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="min-w-48 font-medium">
                    {product.product_name}
                  </TableCell>
                  <TableCell className="min-w-64 whitespace-normal text-muted-foreground">
                    {product.description || "—"}
                  </TableCell>
                  <TableCell className="min-w-36 text-right">
                    <Link
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                      href={`/recipes/${product.id}`}
                    >
                      Manage recipe
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-4 sm:p-6">
            <OperationalEmptyState
              title={
                search
                  ? "No products match this search."
                  : "No active products are available yet."
              }
              description={
                search
                  ? "Try a different product name or clear the search."
                  : "Create an active product before setting up its recipe."
              }
              actions={
                search ? (
                  <Link
                    className={buttonVariants({ variant: "outline" })}
                    href="/recipes"
                  >
                    Clear search
                  </Link>
                ) : (
                  <Link
                    className={buttonVariants({ variant: "outline" })}
                    href="/products"
                  >
                    Open products
                  </Link>
                )
              }
            />
          </div>
        )}

        <div className="border-t px-4 py-3 sm:px-6">
          <OperationalPagination
            ariaLabel="Recipe product pages"
            page={page.page}
            pageCount={pageCount}
            previousHref={
              page.page > 1 ? recipePageHref(page.page - 1, search) : undefined
            }
            nextHref={
              page.page < pageCount
                ? recipePageHref(page.page + 1, search)
                : undefined
            }
            resultSummary={`Page ${page.page} of ${pageCount}`}
          />
        </div>
      </section>
    </div>
  );
}
