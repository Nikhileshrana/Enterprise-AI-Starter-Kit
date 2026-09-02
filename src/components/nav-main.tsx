"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PLATFORM_NAV_ITEMS } from "@/components/nav-items";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {PLATFORM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={
                  pathname === item.url || pathname.startsWith(`${item.url}/`)
                }
                tooltip={item.title}
                render={<Link href={item.url} />}
              >
                <Icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
