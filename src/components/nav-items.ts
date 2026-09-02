import {
  LayoutDashboardIcon,
  Settings2Icon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export const PLATFORM_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    url: "/protected/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    title: "AI",
    url: "/protected/ai",
    icon: SparklesIcon,
  },
  {
    title: "Settings",
    url: "/protected/settings",
    icon: Settings2Icon,
  },
];
