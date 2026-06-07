"use client";

import { useWallet, useWalletSession, useBalance } from "@solana/react-hooks";
import {
  User,
  Wallet,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Save,
  ExternalLink,
  Globe,
  Link2,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getCreatorByWallet,
  createCreator,
  updateCreator,
  type CreatorResponse,
} from "@/lib/api";

// ─── Motion Variants ────────────────────────────────────────────────────────

const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 80, damping: 20 },
  },
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

const PulseDot = memo(function PulseDot() {
  return (
    <motion.span
      className="inline-block size-1.5 rounded-full bg-emerald-500"
      animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
});

// ─── Social Icon Components (lucide-react v1 removed brand icons) ──────────

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="2" width="20" height="20" rx="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 3.5l5.5 7.5-5.5 8h2l4-5.5 4 5.5h5l-6-8.5 5.5-7.5h-2l-3.5 5-3.5-5h-5z" />
    </svg>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect x="4" y="4" width="16" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11v5M8 8v0M12 16v-5M16 16v-3a2 2 0 00-4 0" />
    </svg>
  );
}

// ─── Social Link Input ──────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: InstagramIcon, placeholder: "https://instagram.com/..." },
  { key: "twitter", label: "X / Twitter", icon: TwitterIcon, placeholder: "https://x.com/..." },
  { key: "github", label: "GitHub", icon: GithubIcon, placeholder: "https://github.com/..." },
  { key: "linkedin", label: "LinkedIn", icon: LinkedinIcon, placeholder: "https://linkedin.com/in/..." },
  { key: "website", label: "Website", icon: Globe, placeholder: "https://..." },
];

function SocialLinkInput({
  platform,
  value,
  onChange,
}: {
  platform: (typeof SOCIAL_PLATFORMS)[number];
  value: string;
  onChange: (val: string) => void;
}) {
  const Icon = platform.icon;
  return (
    <div    className="group flex items-center gap-3 rounded-xl border border-border bg-background/50 px-3 py-2.5 hover-glass-strong focus-within:border-emerald-500/30 focus-within:ring-2 focus-within:ring-emerald-500/10">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors duration-200 group-focus-within:bg-emerald-500/10 group-focus-within:text-emerald-600">
        <Icon className="size-4" />
      </div>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={platform.placeholder}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40 text-foreground"
      />
      {value && (
        <motion.a
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted-foreground/50 hover:text-emerald-600 transition-colors"
        >
          <ArrowUpRight className="size-4" />
        </motion.a>
      )}
    </div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-2xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-64 rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="h-5 w-24 rounded-md bg-muted" />
          <div className="h-10 w-full rounded-xl bg-muted" />
          <div className="h-20 w-full rounded-xl bg-muted" />
        </div>
        <div className="h-48 rounded-2xl border border-border bg-card p-6 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-full rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Not Connected ──────────────────────────────────────────────────────────

function NotConnected() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
        className="text-center max-w-sm"
      >
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-premium">
          <User className="size-7 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-xl font-semibold">Your Profile</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Connect your wallet to create or edit your creator profile.
        </p>
        <p className="text-xs text-muted-foreground">
          Use the wallet button in the top-right to connect.
        </p>
      </motion.div>
    </div>
  );
}

// ─── Main Profile Page ──────────────────────────────────────────────────────

export default function ProfilePage() {
  const { status } = useWallet();
  const session = useWalletSession();
  const walletAddress = session?.account.address ?? "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(true);

  // Form fields
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  const [creatorData, setCreatorData] = useState<CreatorResponse | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getCreatorByWallet(walletAddress);
      const profile = data.creator;
      setCreatorData(profile);
      setUsername(profile.username);
      setBio(profile.bio);
      setSocialLinks(profile.socialLinks || {});
      setIsNewProfile(false);
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("404") || err.message.includes("not found"))
      ) {
        setIsNewProfile(true);
        setUsername("");
        setBio("");
        setSocialLinks({});
      } else {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [walletAddress, fetchProfile]);

  const handleSave = async () => {
    if (!walletAddress || !username.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (isNewProfile) {
        const result = await createCreator({
          walletAddress,
          username: username.trim(),
          bio,
          socialLinks,
        });
        setCreatorData(result.creator);
        setIsNewProfile(false);
      } else {
        const result = await updateCreator(walletAddress, {
          username: username.trim() || undefined,
          bio: bio || undefined,
          socialLinks,
        });
        setCreatorData(result.creator);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (status !== "connected" || !session) {
    return <NotConnected />;
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10"
              whileHover={{ scale: 1.1 }}
            >
              <User className="size-5 text-emerald-600" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isNewProfile ? "Create Your Profile" : "Edit Profile"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isNewProfile
                  ? "Set up your creator profile to start receiving tips"
                  : "Update your public creator information"}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Wallet Info */}
          <motion.div
            variants={fadeSlideUp}
            className="rounded-2xl border border-border bg-card p-5 shadow-premium"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
                <Wallet className="size-4 text-emerald-600" />
              </div>
              <h2 className="text-sm font-semibold">Wallet</h2>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <code className="flex-1 font-mono text-xs text-foreground break-all">
                {walletAddress}
              </code>
              <PulseDot />
            </div>
          </motion.div>

          {/* Basic Info */}
          <motion.div
            variants={fadeSlideUp}
            className="rounded-2xl border border-border bg-card p-5 shadow-premium"
          >
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
                <User className="size-4 text-emerald-600" />
              </div>
              <h2 className="text-sm font-semibold">Basic Info</h2>
            </div>

            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Username <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/50">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your-username"
                    className="w-full rounded-xl border border-border bg-background pl-7 pr-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200"
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground/60">
                  Must be unique. Only letters, numbers, underscores, and hyphens.
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your supporters about yourself..."
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200"
                />
              </div>
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            variants={fadeSlideUp}
            className="rounded-2xl border border-border bg-card p-5 shadow-premium"
          >
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
                <Link2 className="size-4 text-emerald-600" />
              </div>
              <h2 className="text-sm font-semibold">Social Links</h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Add links to your social media profiles. These will be displayed on
              your public creator page.
            </p>
            <div className="space-y-2.5">
              {SOCIAL_PLATFORMS.map((platform) => (
                <SocialLinkInput
                  key={platform.key}
                  platform={platform}
                  value={socialLinks[platform.key] || ""}
                  onChange={(val) =>
                    setSocialLinks((prev) => ({
                      ...prev,
                      [platform.key]: val,
                    }))
                  }
                />
              ))}
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-xs text-destructive"
            >
              <AlertCircle className="size-3.5 shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Actions */}
          <motion.div variants={fadeSlideUp} className="flex flex-col gap-3 sm:flex-row">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1"
            >
              <Button
                onClick={handleSave}
                disabled={saving || !username.trim()}
                className="w-full gap-2 rounded-xl py-2.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : success ? (
                  <>
                    <Check className="size-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    {isNewProfile ? "Create Profile" : "Save Changes"}
                  </>
                )}
              </Button>
            </motion.div>

            {!isNewProfile && creatorData && (
              <Link href={`/creator/${creatorData.username}`}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="outline" className="w-full gap-2 rounded-xl sm:w-auto">
                    <ExternalLink className="size-4" />
                    View Public Profile
                  </Button>
                </motion.div>
              </Link>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
