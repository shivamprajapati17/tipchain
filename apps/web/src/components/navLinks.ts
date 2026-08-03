import { Bot, Coins, Compass, Layers, Sparkles, Zap, type LucideIcon } from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
  highlight?: boolean;
};

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/ai", label: "AI", icon: Bot },
  { href: "/quests", label: "Quests" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/defi", label: "DeFi", icon: Zap },
  { href: "/creators", label: "Creators" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/points", label: "Points", icon: Sparkles },
  { href: "/tokenomics", label: "Token", icon: Coins },
  { href: "/vaults", label: "Vaults" },
  { href: "/referrals", label: "Referrals" },
  { href: "/history", label: "History" },
  { href: "/dashboard", label: "Dashboard", icon: Layers, highlight: true },
];

export { Compass };
