import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="flex flex-col gap-6">
      <section
        aria-label="Recipe management summary"
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Choose a product to review its stock-item recipe or configure the
            first recipe.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {page.total} active {page.total === 1 ? "product" : "products"}
          </p>
        </div>
        <form
          action="/recipes"
          method="get"
          role="search"
          className="flex gap-2"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="recipe-product-search">Search products</Label>
            <Input
              id="recipe-product-search"
              name="search"
              maxLength={100}
              defaultValue={search}
              placeholder="Product name"
            />
          </div>
          <Button className="self-end" type="submit" variant="outline">
            Search
          </Button>
        </form>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Product recipes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Page {page.page} of {pageCount}
          </p>
        </CardHeader>
        <CardContent>
          {page.items.length > 0 ? (
            <div className="overflow-x-auto">
              <Table aria-label="Active products available for recipe management">
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
                      <TableCell className="font-medium">
                        {product.product_name}
                      </TableCell>
                      <TableCell className="max-w-md whitespace-normal">
                        {product.description || "—"}
                      </TableCell>
                      <TableCell className="text-right">
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
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="font-medium">
                {search
                  ? "No active products match this search."
                  : "No active products are available yet."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create an active product before setting up its recipe.
              </p>
              <Link
                className={`${buttonVariants({ variant: "outline" })} mt-4`}
                href="/products"
              >
                Open products
              </Link>
            </div>
          )}
          {pageCount > 1 && (
            <nav
              aria-label="Recipe product pages"
              className="mt-4 flex items-center justify-between gap-4"
            >
              {page.page > 1 ? (
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={recipePageHref(page.page - 1, search)}
                >
                  Previous page
                </Link>
              ) : (
                <Button type="button" variant="outline" disabled>
                  Previous page
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page.page} of {pageCount}
              </span>
              {page.page < pageCount ? (
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={recipePageHref(page.page + 1, search)}
                >
                  Next page
                </Link>
              ) : (
                <Button type="button" variant="outline" disabled>
                  Next page
                </Button>
              )}
            </nav>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
