export function CatalogLoading({ title }: { title: string }) {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label={`Loading ${title.toLowerCase()}`}
    >
      <div className="h-12 w-full animate-pulse rounded-2xl bg-muted" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>
      <span className="sr-only" role="status">
        Loading {title.toLowerCase()}.
      </span>
    </div>
  );
}
