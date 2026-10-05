"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  title,
}: {
  title?: string;
  items: {
    title: string;
    url: string;
    icon?: ReactNode;
  }[];
}) {
  const pathname = usePathname();
  const labelId = useId();
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarGroup role="group" aria-labelledby={title ? labelId : undefined}>
      {title && (
        <SidebarGroupLabel
          id={labelId}
          className="mb-1 h-6 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          {title}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const isActive =
              pathname === item.url || pathname.startsWith(`${item.url}/`);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  size="lg"
                  className="h-11 gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors data-active:bg-primary data-active:font-semibold data-active:text-primary-foreground data-active:hover:bg-primary data-active:hover:text-primary-foreground data-active:active:bg-primary data-active:active:text-primary-foreground [&_svg]:size-4.5"
                  tooltip={item.title}
                  isActive={isActive}
                  render={
                    <Link
                      href={item.url}
                      aria-current={isActive ? "page" : undefined}
                      onNavigate={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                    />
                  }
                >
                  {item.icon}
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  {isActive && (
                    <ChevronRightIcon aria-hidden="true" className="ml-auto" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
