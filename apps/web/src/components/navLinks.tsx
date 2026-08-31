"use client";

import { Compass, Users, History, LayoutDashboard, User } from "lucide-react";

export { Compass };

export const NAV_LINKS = [
  { href: "/creators", label: "Creators", icon: Users },
  { href: "/history", label: "History", icon: History },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, highlight: true },
  { href: "/profile", label: "Profile", icon: User },
];
