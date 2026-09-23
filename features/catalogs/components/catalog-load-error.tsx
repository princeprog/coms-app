import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CatalogLoadError({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Unable to load {title.toLowerCase()}</CardTitle>
      </CardHeader>
      <CardContent>
        <p role="alert" className="text-sm text-muted-foreground">
          COMS could not load {title.toLowerCase()}. Try refreshing this page in
          a moment.
        </p>
      </CardContent>
    </Card>
  );
}
