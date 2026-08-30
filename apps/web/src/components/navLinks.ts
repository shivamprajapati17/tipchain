import { Compass, History, Layers, Users, type LucideIcon } from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
  highlight?: boolean;
};

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/creators", label: "Creators", icon: Users },
  { href: "/history", label: "Tip history", icon: History },
  { href: "/dashboard", label: "Dashboard", icon: Layers, highlight: true },
];

export { Compass };
