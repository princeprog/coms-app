import Link from "next/link";
import { ThemeSelector } from "@/components/shared/theme-selector";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { AuthQueryProvider } from "@/features/auth/components/auth-query-provider";

export default async function ChangePasswordPage() {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  const required = session.user.must_change_password === true;
  return (
    <main className="relative flex min-h-svh items-center justify-center bg-muted/40 px-4 py-20">
      <div className="absolute top-4 right-4 z-20 rounded-lg bg-background/90">
        <ThemeSelector />
      </div>
      <Card className="w-full max-w-md shadow-xl shadow-foreground/5">
        <CardHeader className="gap-2 px-6 pt-8 sm:px-10">
          {!required && (
            <Link
              href="/"
              className="mb-2 flex w-fit items-center gap-2 text-sm text-muted-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Link>
          )}
          <h1 className="text-xl font-semibold tracking-tight">
            {required ? "Choose a new password" : "Change password"}
          </h1>
          <CardDescription>
            {required
              ? "Choose your own password before accessing COMS."
              : "Signed in as " + session.user.email + "."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 sm:px-10">
          <AuthQueryProvider>
            <ChangePasswordForm required={required} />
          </AuthQueryProvider>
        </CardContent>
      </Card>
    </main>
  );
}
