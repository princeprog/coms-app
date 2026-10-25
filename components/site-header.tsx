"use client";

import { ThemeSelector } from "@/components/shared/theme-selector";
import { ToastPreviewButton } from "@/components/shared/toast-preview-button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { NotificationArrival } from "@/features/notifications/components/notification-arrival";
import { NotificationSound } from "@/features/notifications/components/notification-sound";
import { ShiftHeaderControl } from "@/features/shifts/components/shift-header-control";
import {
  hasPermission,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeTitles: Record<string, string> = {
  "/expenses/categories": "Expense categories",
  "/expenses": "Expenses",
  "/schedules/shifts": "Branch shifts",
  "/schedules": "Schedules",
  "/my-schedule": "My schedule",
  "/notifications": "Notifications",
  "/branch-products": "Branch Menu",
  "/branch-prices": "Branch Menu",
  "/menu-requests": "Branch Menu",
  "/menu-templates": "Branch Menu",
  "/branches": "Branches",
  "/dashboard": "Dashboard",
  "/dispatches": "Dispatches",
  "/inventory": "Inventory",
  "/pos": "Point of Sale",
  "/products": "Products",
  "/receipts": "Supplier Receiving",
  "/recipes": "Products",
  "/reports": "Daily Reports",
  "/roles": "Roles and permissions",
  "/staff": "Staff",
  "/stock-items": "Stock Items",
  "/suppliers": "Suppliers",
  "/payment-methods": "Payment methods",
  "/shifts/start": "Start shift",
  "/shifts/end": "End shift",
  "/shifts": "Cash shifts",
  "/business-day": "Business day",
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/recipes/")) return "Products";

  const route = Object.keys(routeTitles).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return route ? routeTitles[route] : "COMS";
}

export function SiteHeader({ user }: { user?: User }) {
  const pathname = usePathname();
  const productFormTitle =
    pathname === "/products/new"
      ? "Create product"
      : pathname.startsWith("/products/") && pathname.endsWith("/setup")
        ? "Edit product"
        : null;

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        {productFormTitle ? (
          <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/products" />}>
                  Products
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{productFormTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <h1 className="min-w-0 truncate text-base font-medium">
            {getPageTitle(pathname)}
          </h1>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ToastPreviewButton />
          {user?.role?.isActive && (
            <>
              {hasPermission(user, "shifts.operate") &&
                !isProtectedSuperAdmin(user) && <ShiftHeaderControl />}
              <NotificationBell key={pathname} userId={user.id} />
              <NotificationArrival userId={user.id} />
              <NotificationSound key={user.id} userId={user.id} />
            </>
          )}
          <ThemeSelector />
        </div>
      </div>
    </header>
  );
}
