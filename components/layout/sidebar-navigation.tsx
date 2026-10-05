import type { User } from "@/features/auth/types/auth.types";
import {
  filterNavigationForUser,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";

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

export const sidebarNavigationGroups = [
  { title: "Overview", urls: ["/dashboard"] },
  {
    title: "Supply & Inventory",
    urls: [
      "/inventory",
      "/stock-items",
      "/suppliers",
      "/receipts",
      "/dispatches",
    ],
  },
  {
    title: "Products & Sales",
    urls: ["/products", "/recipes", "/branch-products", "/pos", "/reports"],
  },
  { title: "Administration", urls: ["/branches", "/staff", "/roles"] },
];

export function getAppSidebarNavigationGroups(user: User) {
  const items = getAppSidebarNavigation(user);
  return sidebarNavigationGroups
    .map((group) => ({
      title: group.title,
      items: group.urls.flatMap((url) =>
        items.filter((item) => item.url === url),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
