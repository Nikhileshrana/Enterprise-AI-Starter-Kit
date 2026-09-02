"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { OrganizationDialog } from "@/components/organization-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth/client";
import type { Organization } from "@/lib/types";
import {
  AudioLinesIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  GalleryVerticalEndIcon,
  PlusIcon,
} from "lucide-react";

export function OrganizationSwitcher({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "logo";
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [{ data: orgs, error }, session] = await Promise.all([
      authClient.organization.list(),
      authClient.getSession({ query: { disableCookieCache: true } }),
    ]);

    if (error) {
      toast.add({
        title: "Failed to load organizations",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    const list = (orgs ?? []) as Organization[];
    setOrganizations(list);
    setActiveOrgId(
      session.data?.session.activeOrganizationId ?? list[0]?.id ?? null,
    );
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const activeOrg = organizations.find((org) => org.id === activeOrgId) ?? null;

  async function switchOrganization(organizationId: string) {
    const { error } = await authClient.organization.setActive({
      organizationId,
    });
    if (error) {
      toast.add({
        title: "Could not switch organization",
        description: error.message,
      });
      return;
    }
    setActiveOrgId(organizationId);
    await load();
    router.refresh();
  }

  const menuContent = (
    <DropdownMenuContent
      className="w-64"
      align="start"
      side={variant === "logo" ? "bottom" : isMobile ? "bottom" : "right"}
      sideOffset={4}
    >
      <DropdownMenuGroup>
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => void switchOrganization(org.id)}
            className="gap-2 p-2"
          >
            <div className="flex size-6 items-center justify-center rounded-md border">
              <AudioLinesIcon />
            </div>
            <span className="flex-1 truncate">{org.name}</span>
            {org.id === activeOrgId ? <CheckIcon /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          className="gap-2 p-2"
          onClick={() => setCreateOpen(true)}
        >
          <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
            <PlusIcon />
          </div>
          <span className="font-medium text-muted-foreground">
            Create organization
          </span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );

  const createDialog = (
    <OrganizationDialog
      open={createOpen}
      onOpenChange={setCreateOpen}
      onCreated={async (organization) => {
        setActiveOrgId(organization.id);
        await load();
      }}
    />
  );

  if (variant === "logo") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-10 gap-2 px-1.5"
                aria-label="Switch organization"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GalleryVerticalEndIcon />
            </div>
            <div className="grid min-w-0 flex-1 text-start text-sm leading-tight">
              {loading ? (
                <>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-1 h-3 w-16" />
                </>
              ) : (
                <>
                  <span className="truncate font-medium">
                    {activeOrg?.name ?? "Select organization"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeOrg?.slug ?? "Organization"}
                  </span>
                </>
              )}
            </div>
          </DropdownMenuTrigger>
          {menuContent}
        </DropdownMenu>
        {createDialog}
      </>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                />
              }
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEndIcon />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                {loading ? (
                  <>
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="mt-1 h-3 w-20" />
                  </>
                ) : (
                  <>
                    <span className="truncate font-medium">
                      {activeOrg?.name ?? "Select organization"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {activeOrg?.slug ?? "Organization"}
                    </span>
                  </>
                )}
              </div>
              <ChevronsUpDownIcon className="ms-auto" />
            </DropdownMenuTrigger>
            {menuContent}
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {createDialog}
    </>
  );
}
