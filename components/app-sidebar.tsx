"use client";

import * as React from "react";
import Image from "next/image";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import type { User } from "@/features/auth/types/auth.types";
import { filterNavigationForUser } from "@/features/auth/permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  BoxesIcon,
  ClipboardListIcon,
  TruckIcon,
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

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon /> },
  {
    title: "Inventory",
    url: "/inventory",
    permission: "inventory.read",
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
    title: "Receiving",
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
    title: "Replenishment",
    url: "/replenishment",
    permission: "stock_requests.read",
    icon: <TruckIcon />,
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
export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-auto data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
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
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filterNavigationForUser(user, navItems)} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.full_name,
            email: user.email,
            avatar: "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
