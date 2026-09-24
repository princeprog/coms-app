import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DailyReportsLoading() {
  return (
    <div
      role="status"
      aria-label="Loading daily reports"
      aria-busy="true"
      className="grid gap-4"
    >
      <Card>
        <CardHeader>
          <div className="h-5 w-40 animate-pulse rounded-full bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-9 w-full animate-pulse rounded-3xl bg-muted" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="h-5 w-48 animate-pulse rounded-full bg-muted" />
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="h-12 animate-pulse rounded-3xl bg-muted" />
          <div className="h-12 animate-pulse rounded-3xl bg-muted" />
          <div className="h-12 animate-pulse rounded-3xl bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
