import { redirect } from "next/navigation";

import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { LoginPage } from "@/features/auth/components/login-page";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";

export default async function Page() {
  const session = await getCurrentUserFromServer();

  if (session.status === "authenticated") {
    redirect("/dashboard");
  }

  if (session.status === "unavailable") {
    return <AuthServiceError context="login" />;
  }

  if (session.status === "recovering") {
    return <SessionRecovery />;
  }

  return <LoginPage />;
}
