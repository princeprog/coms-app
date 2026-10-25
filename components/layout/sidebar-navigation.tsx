import {
  filterNavigationForUser,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";

import {
  BoxesIcon,
  CalendarDaysIcon,
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

// Each icon has its own hue (600 light, 400 dark); the active item turns it
// white on the primary background (see NavMain).
export const navItems = [
  {
    title: "Payment methods",
    url: "/payment-methods",
    icon: <CreditCardIcon className="text-emerald-600 dark:text-emerald-400" />,
  },
  {
    title: "Business day",
    url: "/business-day",
    icon: (
      <CalendarClockIcon className="text-orange-600 dark:text-orange-400" />
    ),
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    permission: ["dashboard.read", "dashboard.global_read"],
    icon: <LayoutDashboardIcon className="text-sky-600 dark:text-sky-400" />,
  },
  {
    title: "Expenses",
    url: "/expenses",
    permission: "expenses.read",
    icon: <CoinsIcon className="text-emerald-600 dark:text-emerald-400" />,
  },
  {
    title: "Sales report",
    url: "/sales-report",
    permission: "sales_report.read",
    icon: <ReceiptTextIcon className="text-violet-600 dark:text-violet-400" />,
  },
  {
    title: "Inventory",
    url: "/inventory",
    permission: ["inventory.read", "inventory.commissary_read"],
    icon: <BoxesIcon className="text-amber-600 dark:text-amber-400" />,
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    permission: "suppliers.read",
    icon: <FactoryIcon className="text-indigo-600 dark:text-indigo-400" />,
  },
  {
    title: "Stock Items",
    url: "/stock-items",
    permission: "stock_items.read",
    icon: <TagsIcon className="text-teal-600 dark:text-teal-400" />,
  },
  {
    title: "Supplier Receiving",
    url: "/receipts",
    permission: "supplier_receipts.read",
    icon: <ClipboardListIcon className="text-green-600 dark:text-green-400" />,
  },
  {
    title: "Dispatches",
    url: "/dispatches",
    permission: "dispatches.read",
    icon: <SendIcon className="text-blue-600 dark:text-blue-400" />,
  },
  {
    title: "Products",
    url: "/products",
    permission: "products.read",
    icon: <PackageIcon className="text-rose-600 dark:text-rose-400" />,
  },
  {
    title: "Branch Menu",
    url: "/branch-products",
    permission: "branch_products.read",
    icon: <StoreIcon className="text-fuchsia-600 dark:text-fuchsia-400" />,
  },
  {
    title: "Point of Sale",
    url: "/pos",
    permission: ["sales.create", "sales.read"],
    icon: <StoreIcon className="text-cyan-600 dark:text-cyan-400" />,
  },
  {
    title: "Schedules",
    url: "/schedules",
    permission: "schedules.read",
    icon: <CalendarDaysIcon className="text-teal-600 dark:text-teal-400" />,
  },
  {
    title: "Cash shifts",
    url: "/shifts",
    permission: "shifts.read",
    icon: <ClockIcon className="text-orange-600 dark:text-orange-400" />,
  },
  {
    title: "Daily Reports",
    url: "/reports",
    permission: "daily_reports.read",
    icon: (
      <FileChartColumnIcon className="text-purple-600 dark:text-purple-400" />
    ),
  },
  {
    title: "Branches",
    url: "/branches",
    permission: "branches.read",
    icon: <Building2Icon className="text-sky-600 dark:text-sky-400" />,
  },
  {
    title: "Staff",
    url: "/staff",
    permission: "staff.read",
    icon: <UsersIcon className="text-violet-600 dark:text-violet-400" />,
  },
  {
    title: "Roles",
    url: "/roles",
    permission: "roles.read",
    icon: <ShieldCheckIcon className="text-indigo-600 dark:text-indigo-400" />,
  },
  {
    title: "Audit log",
    url: "/audit-log",
    permission: "audit.read",
    icon: <HistoryIcon className="text-slate-600 dark:text-slate-400" />,
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
  { title: "Overview", urls: ["/dashboard", "/expenses", "/sales-report"] },
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
    urls: [
      "/products",
      "/branch-products",
      "/pos",
      "/schedules",
      "/shifts",
      "/reports",
    ],
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
