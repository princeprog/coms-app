import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { RecipeProductList } from "@/features/recipes/components/recipe-product-list";
import { recipesRoute } from "@/features/recipes/constants";
import { getProductPageData } from "@/features/products/services/product-queries";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { ApiRequestError } from "@/services/api-services";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function requestedPage(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 && page <= 1_000_000 ? page : 1;
}

function createRecipeHref(page: number, search: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${recipesRoute}?${query}` : recipesRoute;
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  if (!hasPermission(session.user, "recipes.read")) notFound();

  if (!hasPermission(session.user, "products.read")) {
    return (
      <AppPageShell user={session.user} title="Recipes">
        <Card>
          <CardHeader>
            <CardTitle>Product list unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p role="status" className="text-sm text-muted-foreground">
              Product read access is required to choose a product recipe.
            </p>
          </CardContent>
        </Card>
      </AppPageShell>
    );
  }

  const params = await searchParams;
  const search = (first(params.search) ?? "").trim().slice(0, 100);
  const page = requestedPage(first(params.page));
  let productPage: Awaited<ReturnType<typeof getProductPageData>> | null = null;
  try {
    productPage = await getProductPageData({
      page,
      search,
      active: true,
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && error.status === 403) notFound();
  }
  if (!productPage) {
    return (
      <AppPageShell user={session.user} title="Recipes">
        <CatalogLoadError title="active products" />
      </AppPageShell>
    );
  }

  const pageCount = Math.max(
    1,
    Math.ceil(productPage.total / productPage.page_size),
  );
  if (page > pageCount) redirect(createRecipeHref(pageCount, search));

  return (
    <AppPageShell user={session.user} title="Recipes">
      <RecipeProductList page={productPage} search={search} />
    </AppPageShell>
  );
}
