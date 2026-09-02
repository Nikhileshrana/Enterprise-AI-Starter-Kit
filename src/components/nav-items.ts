import {
  LayoutDashboardIcon,
  Settings2Icon,
  SparklesIcon,
} from "lucide-react";
import type { NavItem } from "@/lib/types";

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
