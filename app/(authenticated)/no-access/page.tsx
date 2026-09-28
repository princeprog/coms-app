import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NoAccessPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>No workspace access</CardTitle>
          <CardDescription>
            Your account is active, but it does not have access to any workspace
            yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ask an administrator to assign a role and the permissions you need.
        </CardContent>
      </Card>
    </main>
  );
}
