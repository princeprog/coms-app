import {
  filterNavigationForUser,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";

import {
  BoxesIcon,
  CalendarClockIcon,
  ClockIcon,
  CoinsIcon,
  CreditCardIcon,
  Building2Icon,
  ClipboardListIcon,
  FactoryIcon,
  FileChartColumnIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  PackageIcon,
  ReceiptTextIcon,
  SendIcon,
  ShieldCheckIcon,
  StoreIcon,
  TagsIcon,
  UsersIcon,
} from "lucide-react";

export const navItems = [
  {
    title: "Payment methods",
    url: "/payment-methods",
    icon: <CreditCardIcon />,
  },
  {
    title: "Business day",
    url: "/business-day",
    icon: <CalendarClockIcon />,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    permission: ["dashboard.read", "dashboard.global_read"],
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Costs & profit",
    url: "/costs",
    permission: "costs.read",
    icon: <CoinsIcon />,
  },
  {
    title: "Sales report",
    url: "/sales-report",
    permission: "sales_report.read",
    icon: <ReceiptTextIcon />,
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
    title: "Branch Menu",
    url: "/branch-products",
    permission: "branch_products.read",
    icon: <StoreIcon />,
  },
  {
    title: "Point of Sale",
    url: "/pos",
    permission: ["sales.create", "sales.read"],
    icon: <StoreIcon />,
  },
  {
    title: "Shifts",
    url: "/shifts",
    permission: "shifts.read",
    icon: <ClockIcon />,
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
  {
    title: "Audit log",
    url: "/audit-log",
    permission: "audit.read",
    icon: <HistoryIcon />,
  },
];

export function getAppSidebarNavigation(user: User) {
  const contextualItems = isProtectedSuperAdmin(user)
    ? navItems.filter((item) => item.url !== "/pos")
    : navItems.filter(
        (item) =>
          item.url !== "/payment-methods" && item.url !== "/business-day",
      );
  const allowed = filterNavigationForUser(user, contextualItems);
  const productRoutes = ["/products"];
  const menuRoutes = ["/branch-products"];
  const productEntry = allowed.find((item) => productRoutes.includes(item.url));
  const menuEntry = allowed.find((item) => menuRoutes.includes(item.url));
  return allowed.flatMap((item) => {
    if (productRoutes.includes(item.url))
      return item === productEntry
        ? [{ ...item, title: "Products", activeUrls: productRoutes }]
        : [];
    if (menuRoutes.includes(item.url))
      return item === menuEntry
        ? [{ ...item, title: "Branch Menu", activeUrls: menuRoutes }]
        : [];
    return [item];
  });
}

export const sidebarNavigationGroups = [
  { title: "Overview", urls: ["/dashboard", "/costs", "/sales-report"] },
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
    urls: ["/products", "/branch-products", "/pos", "/shifts", "/reports"],
  },
  {
    title: "Administration",
    urls: [
      "/branches",
      "/staff",
      "/roles",
      "/payment-methods",
      "/business-day",
      "/audit-log",
    ],
  },
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
