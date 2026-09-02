"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LayoutDashboardIcon, Settings2Icon } from "lucide-react";

const items = [
  {
    title: "Dashboard",
    url: "/protected/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Settings",
    url: "/protected/settings",
    icon: <Settings2Icon />,
  },
] as const;

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
              tooltip={item.title}
              render={<Link href={item.url} />}
            >
              {item.icon}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
