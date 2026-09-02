"use client";

import type { ComponentProps } from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser, type NavUserData } from "@/components/nav-user";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function AppSidebar({
  user,
  ...props
}: ComponentProps<typeof Sidebar> & { user: NavUserData }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:order-2 group-data-[collapsible=icon]:flex-none">
            <OrganizationSwitcher />
          </div>
          <Separator
            orientation="vertical"
            className="mx-0.5 data-vertical:h-4 data-vertical:self-auto group-data-[collapsible=icon]:hidden"
          />
          <SidebarTrigger className="shrink-0 group-data-[collapsible=icon]:order-1" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
