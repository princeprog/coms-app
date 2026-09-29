import { notFound, redirect } from "next/navigation";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import {
  hasPermission,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";

import data from "./data.json";

export default async function DashboardPage() {
  const session = await getCurrentUserFromServer();

  if (session.status === "unauthenticated") {
    redirect("/");
  }

  if (session.status === "unavailable") {
    return <AuthServiceError context="dashboard" />;
  }

  if (session.status === "recovering") {
    return <SessionRecovery />;
  }

  const user = session.user;
  const canViewDashboard =
    isProtectedSuperAdmin(user) ||
    hasPermission(user, "dashboard.read") ||
    hasPermission(user, "dashboard.global_read");

  if (!canViewDashboard) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable data={data} />
        </div>
      </div>
    </div>
  );
}
