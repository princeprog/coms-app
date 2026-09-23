import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AuthQuerySeed } from "@/features/auth/components/auth-query-seed";
import type { User } from "@/features/auth/types/auth.types";

export function AppPageShell({
  user,
  title,
  children,
}: {
  user: User;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <AuthQuerySeed user={user} />
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" user={user} />
        <SidebarInset>
          <SiteHeader title={title} />
          <main className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
