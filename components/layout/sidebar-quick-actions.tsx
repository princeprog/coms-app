"use client";

import Link from "next/link";
import {
  ChevronDownIcon,
  ClipboardListIcon,
  FileChartColumnIcon,
  PlusIcon,
  ShoppingCartIcon,
  TruckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import {
  hasPermission,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";

const quickActions = [
  {
    title: "New receipt",
    href: "/receipts?create=1",
    icon: ClipboardListIcon,
    permissions: [
      "supplier_receipts.read",
      "supplier_receipts.create",
      "suppliers.read",
      "stock_items.read",
    ],
  },
  {
    title: "New stock request",
    href: "/replenishment?create=1",
    icon: TruckIcon,
    permissions: [
      "stock_requests.read",
      "stock_requests.create",
      "branches.read",
      "stock_items.read",
    ],
  },
  {
    title: "New sale",
    href: "/pos",
    icon: ShoppingCartIcon,
    permissions: ["sales.create", "branch_products.read"],
  },
  {
    title: "New daily report",
    href: "/reports?create=1",
    icon: FileChartColumnIcon,
    permissions: ["daily_reports.read", "daily_reports.create"],
  },
] as const;

export function getSidebarQuickActions(user: User) {
  return quickActions.filter((action) =>
    action.permissions.every((permission) => hasPermission(user, permission)) &&
    (!isProtectedSuperAdmin(user) || action.title === "New receipt"),
  );
}

export function SidebarQuickActions({ user }: { user: User }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const actions = getSidebarQuickActions(user);
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button type="button" className="w-full justify-between" />}
      >
        <span className="flex items-center gap-2">
          <PlusIcon />
          Quick Actions
        </span>
        <ChevronDownIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-(--anchor-width)">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.title}
            render={
              <Link
                href={action.href}
                onNavigate={() => {
                  if (isMobile) setOpenMobile(false);
                }}
              />
            }
          >
            <action.icon />
            {action.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
