import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { Toaster } from "@/components/ui/toast";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getCurrentUserFromServer();

  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return <AuthServiceError context="dashboard" />;
  }

  return (
    <AuthenticatedAppShell user={session.user}>
      {children}
      <Toaster />
    </AuthenticatedAppShell>
  );
}
