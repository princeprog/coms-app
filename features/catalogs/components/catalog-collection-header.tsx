import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function CatalogCollectionHeader({
  title,
  resourceName,
  directoryTitle,
  directoryDescription,
  pending,
}: {
  title: string;
  resourceName: string;
  directoryTitle?: string;
  directoryDescription?: string;
  pending: boolean;
}) {
  return (
    <CardHeader className="border-b px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <CardTitle>
            <h3 id="catalog-directory-heading">
              {directoryTitle ??
                (resourceName === "supplier"
                  ? "Supplier directory"
                  : resourceName === "product"
                    ? "Product catalog"
                    : "Stock item directory")}
            </h3>
          </CardTitle>
          {directoryDescription !== "" && (
            <CardDescription>
              {directoryDescription ??
                (resourceName === "supplier"
                  ? "Supplier contacts for receiving, listed A–Z."
                  : resourceName === "product"
                    ? "One selling price per product. Open details to view branch availability."
                    : "Stock item categories and units, listed A–Z.")}
            </CardDescription>
          )}
        </div>
        {pending && (
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Spinner aria-hidden="true" />
            Updating {title.toLowerCase()}...
          </p>
        )}
      </div>
    </CardHeader>
  );
}
