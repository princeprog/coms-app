"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { SidebarQuickActions } from "@/components/layout/sidebar-quick-actions";
import { getAppSidebarNavigationGroups } from "@/components/layout/sidebar-navigation";
import type { User } from "@/features/auth/types/auth.types";
import { getAuthorizedLandingPath } from "@/features/auth/permissions";
import { authKeys } from "@/features/auth/query-keys";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
export {
  getAppSidebarNavigation,
  navItems,
} from "@/components/layout/sidebar-navigation";

function SidebarBrand({ user }: { user: User }) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          className="h-auto data-[slot=sidebar-menu-button]:p-1.5!"
          render={
            <Link
              href={getAuthorizedLandingPath(user)}
              aria-label="Go to your workspace"
              onNavigate={() => {
                if (isMobile) setOpenMobile(false);
              }}
            />
          }
        >
          <Image
            src="/images/emmas%20chicken%20house%20logo.png"
            alt="Emma's Chicken House"
            width={150}
            height={50}
            priority
            className="h-auto w-full max-w-none object-contain"
          />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export const AppSidebar = React.memo(function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User }) {
  const { data: currentUser = user } = useQuery({
    queryKey: authKeys.me,
    queryFn: async () => user,
    initialData: user,
    enabled: false,
  });

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="gap-2 px-3 pb-3">
        <SidebarBrand user={currentUser} />
        <SidebarQuickActions user={currentUser} />
      </SidebarHeader>
      <SidebarSeparator className="data-horizontal:w-auto" />
      <SidebarContent className="px-1 py-2">
        <nav aria-label="Main navigation" className="flex flex-col gap-1">
          {getAppSidebarNavigationGroups(currentUser).map((group) => (
            <NavMain
              key={group.title}
              title={group.title}
              items={group.items}
            />
          ))}
        </nav>
      </SidebarContent>
      <SidebarSeparator className="data-horizontal:w-auto" />
      <SidebarFooter className="p-3">
        <NavUser
          user={{
            name: currentUser.full_name,
            email: currentUser.email,
            avatar: "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
});
