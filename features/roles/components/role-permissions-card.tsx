import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReactNode } from "react";

export function RolePermissionsCard({
  description,
  children,
}: {
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="min-h-0 min-w-0 gap-0 py-0 lg:col-span-2">
      <CardHeader
        data-role-permissions-header
        className="shrink-0 px-3 pt-3 pb-2 sm:px-5 sm:pt-4 sm:pb-3"
      >
        <CardTitle>
          <h3 className="text-lg font-semibold">Permissions</h3>
        </CardTitle>
        <CardDescription data-role-permission-description>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent
        data-role-permissions-content
        className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pb-3 sm:px-5 sm:pb-4"
      >
        {children}
      </CardContent>
    </Card>
  );
}
