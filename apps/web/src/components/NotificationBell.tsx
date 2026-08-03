"use client";

import { useWalletConnection } from "@solana/react-hooks";
import { Bell, Check, CheckCheck, Coins, Gift, Layers, Star, Users, Award, Lock, Inbox } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationResponse,
} from "@/lib/api";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function notificationStyle(type: string) {
  switch (type) {
    case "tip":
      return { icon: Coins, className: "text-emerald-400 bg-emerald-500/10" };
    case "follow":
      return { icon: Users, className: "text-sky-400 bg-sky-500/10" };
    case "membership":
    case "subscription":
      return { icon: Star, className: "text-amber-400 bg-amber-500/10" };
    case "badge":
      return { icon: Award, className: "text-violet-400 bg-violet-500/10" };
    case "referral":
      return { icon: Gift, className: "text-rose-400 bg-rose-500/10" };
    case "vault":
      return { icon: Layers, className: "text-cyan-400 bg-cyan-500/10" };
    default:
      return { icon: Bell, className: "text-white/60 bg-white/5" };
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function NotificationBell() {
  const { connected, wallet } = useWalletConnection();
  const walletAddress = connected && wallet ? wallet.account.address : null;

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!walletAddress) return;
    if (!silent) setLoading(true);
    try {
      const data = await getNotifications(walletAddress, false, 20);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Poll every 60s while connected; refresh when the panel opens.
  useEffect(() => {
    if (!walletAddress) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    void fetchNotifications(true);
    const interval = setInterval(() => void fetchNotifications(true), 60_000);
    return () => clearInterval(interval);
  }, [walletAddress, fetchNotifications]);

  useEffect(() => {
    if (isOpen && walletAddress) void fetchNotifications(false);
  }, [isOpen, walletAddress, fetchNotifications]);

  // Close on outside click.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(id);
    } catch {
      // Non-fatal — state is already updated optimistically.
    }
  };

  const handleMarkAllRead = async () => {
    if (!walletAddress) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead(walletAddress);
    } catch {
      // Non-fatal.
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;
  const badgeCount = unreadCount > 0 ? unreadCount : 0;

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex items-center justify-center size-8 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
      >
        <Bell className="size-4" />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-black">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl glass-card shadow-premium-lg z-50"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unread > 0 && (
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    {unread} new
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-white/50 hover:text-white transition-colors"
                >
                  <CheckCheck className="size-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Panel body */}
            <div className="max-h-80 overflow-y-auto">
              {!walletAddress ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-white/40">
                    <Lock className="size-4" />
                  </span>
                  <p className="text-xs text-white/50">
                    Connect your wallet to see tip, follow, badge and vault
                    notifications.
                  </p>
                </div>
              ) : loading && notifications.length === 0 ? (
                <div className="space-y-2 px-4 py-5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="shimmer h-12 rounded-xl" />
                  ))}
                </div>
              ) : error ? (
                <div className="px-6 py-8 text-center text-xs text-rose-400">{error}</div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-white/40">
                    <Inbox className="size-4" />
                  </span>
                  <p className="text-xs text-white/50">
                    No notifications yet. When someone tips you, follows you, or
                    awards you a badge, it shows up here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => {
                    const { icon: Icon, className } = notificationStyle(notification.type);
                    return (
                      <button
                        key={notification.id}
                        onClick={() => {
                          if (!notification.isRead) void handleMarkRead(notification.id);
                        }}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                      >
                        <span
                          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${className}`}
                        >
                          <Icon className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-xs font-semibold text-white">
                              {notification.title}
                            </span>
                            {!notification.isRead && (
                              <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
                            )}
                          </span>
                          <span className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-white/50">
                            {notification.body}
                          </span>
                          <span className="mt-1 block text-[10px] text-white/30">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </span>
                        {!notification.isRead && (
                          <Check className="mt-1 size-3 shrink-0 text-white/25" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
