"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth/client";
import type { NavUserProps } from "@/lib/types";
import {
  ChevronsUpDownIcon,
  LaptopIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  SunMoonIcon,
} from "lucide-react";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function NavUser({ user, variant = "sidebar" }: NavUserProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function handleLogout() {
    await signOut();
    router.replace("/");
    router.refresh();
  }

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          variant === "header" ? (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Account menu"
            />
          ) : (
            <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
          )
        }
      >
        <Avatar>
          <AvatarImage src={user.image ?? undefined} alt={user.name} />
          <AvatarFallback>{initials(user.name) || "U"}</AvatarFallback>
        </Avatar>
        {variant === "sidebar" ? (
          <>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ms-auto size-4" />
          </>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-fit min-w-56"
        side={variant === "header" ? "bottom" : isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
              <Avatar>
                <AvatarImage src={user.image ?? undefined} alt={user.name} />
                <AvatarFallback>{initials(user.name) || "U"}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <SunMoonIcon />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={theme ?? "system"}
                onValueChange={setTheme}
              >
                <DropdownMenuRadioItem value="light">
                  <SunIcon />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <MoonIcon />
                  Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <LaptopIcon />
                  System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOutIcon />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (variant === "header") {
    return menu;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>{menu}</SidebarMenuItem>
    </SidebarMenu>
  );
}
