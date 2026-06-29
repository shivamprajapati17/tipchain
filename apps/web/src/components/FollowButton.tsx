"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { followCreator, unfollowCreator, getFollowers } from "@/lib/api";

interface FollowButtonProps {
  creatorWallet: string;
  followerWallet: string;
  size?: "sm" | "default";
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ creatorWallet, followerWallet, size = "default", onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function checkFollow() {
      if (!followerWallet) {
        setLoading(false);
        return;
      }
      try {
        const data = await getFollowers(creatorWallet);
        setIsFollowing(data.followers.some((f: any) => f.followerWallet === followerWallet));
      } catch {
        // Not following
      } finally {
        setLoading(false);
      }
    }
    checkFollow();
  }, [creatorWallet, followerWallet]);

  const handleToggle = useCallback(async () => {
    if (!followerWallet) return;
    setActionLoading(true);
    try {
      if (isFollowing) {
        await unfollowCreator(followerWallet, creatorWallet);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await followCreator(followerWallet, creatorWallet);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch {
      // Silently fail
    } finally {
      setActionLoading(false);
    }
  }, [isFollowing, followerWallet, creatorWallet, onFollowChange]);

  if (loading || !followerWallet) {
    return (
      <Button variant="outline" size={size === "sm" ? "sm" : "default"} className="gap-1.5 rounded-xl" disabled>
        <Loader2 className="size-3.5 animate-spin" />
        <span className="text-xs">...</span>
      </Button>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
      <Button
        onClick={handleToggle}
        variant={isFollowing ? "outline" : "default"}
        size={size === "sm" ? "sm" : "default"}
        className="gap-1.5 rounded-xl transition-all duration-300"
        disabled={actionLoading}
      >
        {actionLoading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="size-3.5" />
        ) : (
          <UserPlus className="size-3.5" />
        )}
        <span className="text-xs">{isFollowing ? "Following" : "Follow"}</span>
      </Button>
    </motion.div>
  );
}
