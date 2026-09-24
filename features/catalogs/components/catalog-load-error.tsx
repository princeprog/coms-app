import { OperationalLoadError } from "@/components/shared/operational-load-error";

export function CatalogLoadError({ title }: { title: string }) {
  return (
    <OperationalLoadError
      title={title}
      description={`COMS could not load ${title.toLowerCase()}. Try again in a moment.`}
    />
  );
}
