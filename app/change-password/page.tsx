import Link from "next/link";
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
import { Toaster } from "@/components/ui/toast";

export default async function ChangePasswordPage() {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  const required = session.user.must_change_password === true;
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-8">
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
              ? "Your password was reset. Choose a new one to continue."
              : "Signed in as " + session.user.email + "."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 sm:px-10">
          <AuthQueryProvider>
            <ChangePasswordForm required={required} />
          </AuthQueryProvider>
        </CardContent>
      </Card>
      <Toaster />
    </main>
  );
}
