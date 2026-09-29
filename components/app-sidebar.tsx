"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { SidebarQuickActions } from "@/components/layout/sidebar-quick-actions";
import type { User } from "@/features/auth/types/auth.types";
import {
  filterNavigationForUser,
  getAuthorizedLandingPath,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import { authKeys } from "@/features/auth/query-keys";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  BoxesIcon,
  ClipboardListIcon,
  SendIcon,
  PackageIcon,
  StoreIcon,
  FileChartColumnIcon,
  Building2Icon,
  UsersIcon,
  ShieldCheckIcon,
  FactoryIcon,
  TagsIcon,
  ChefHatIcon,
} from "lucide-react";

export const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    permission: ["dashboard.read", "dashboard.global_read"],
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Inventory",
    url: "/inventory",
    permission: ["inventory.read", "inventory.commissary_read"],
    icon: <BoxesIcon />,
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    permission: "suppliers.read",
    icon: <FactoryIcon />,
  },
  {
    title: "Stock Items",
    url: "/stock-items",
    permission: "stock_items.read",
    icon: <TagsIcon />,
  },
  {
    title: "Supplier Receiving",
    url: "/receipts",
    permission: "supplier_receipts.read",
    icon: <ClipboardListIcon />,
  },
  {
    title: "Dispatches",
    url: "/dispatches",
    permission: "dispatches.read",
    icon: <SendIcon />,
  },
  {
    title: "Products",
    url: "/products",
    permission: "products.read",
    icon: <PackageIcon />,
  },
  {
    title: "Recipes",
    url: "/recipes",
    permission: "recipes.read",
    icon: <ChefHatIcon />,
  },
  {
    title: "Branch Products",
    url: "/branch-products",
    permission: "branch_products.read",
    icon: <StoreIcon />,
  },
  {
    title: "Point of Sale",
    url: "/pos",
    permission: "sales.create",
    icon: <StoreIcon />,
  },
  {
    title: "Daily Reports",
    url: "/reports",
    permission: "daily_reports.read",
    icon: <FileChartColumnIcon />,
  },
  {
    title: "Branches",
    url: "/branches",
    permission: "branches.read",
    icon: <Building2Icon />,
  },
  {
    title: "Staff",
    url: "/staff",
    permission: "staff.read",
    icon: <UsersIcon />,
  },
  {
    title: "Roles",
    url: "/roles",
    permission: "roles.read",
    icon: <ShieldCheckIcon />,
  },
];

export function getAppSidebarNavigation(user: User) {
  const contextualItems = isProtectedSuperAdmin(user)
    ? navItems.filter((item) => item.url !== "/pos")
    : navItems;
  return filterNavigationForUser(user, contextualItems);
}

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
      <SidebarHeader>
        <SidebarBrand user={currentUser} />
        <SidebarQuickActions user={currentUser} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={getAppSidebarNavigation(currentUser)} />
      </SidebarContent>
      <SidebarFooter>
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
