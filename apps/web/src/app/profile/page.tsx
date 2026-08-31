"use client";

import { useWallet, useWalletSession } from "@solana/react-hooks";
import { User, Wallet, Copy, Check, Loader2, AlertCircle, Save, ExternalLink, Globe, Link2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getCreatorByWallet, createCreator, updateCreator, type CreatorResponse } from "@/lib/api";

const SOCIAL_PLATFORMS = [
  { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/..." },
  { key: "github", label: "GitHub", placeholder: "https://github.com/..." },
  { key: "website", label: "Website", placeholder: "https://..." },
];

function NotConnected() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03]">
          <User className="size-7 text-white/30" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-white">Your Profile</h1>
        <p className="mb-6 text-sm text-white/40">Connect your wallet to create or edit your creator profile.</p>
      </motion.div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { status } = useWallet();
  const session = useWalletSession();
  const walletAddress = session?.account.address ?? "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(true);
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
      setCreatorData(data.creator);
      setUsername(data.creator.username);
      setBio(data.creator.bio);
      setSocialLinks(data.creator.socialLinks || {});
      setIsNewProfile(false);
    } catch (err) {
      if (err instanceof Error && (err.message.includes("404") || err.message.includes("not found"))) {
        setIsNewProfile(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      }
    } finally { setLoading(false); }
  }, [walletAddress]);

  useEffect(() => { if (walletAddress) fetchProfile(); else setLoading(false); }, [walletAddress, fetchProfile]);

  const handleSave = async () => {
    if (!walletAddress || !username.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      if (isNewProfile) {
        const result = await createCreator({ walletAddress, username: username.trim(), bio, socialLinks });
        setCreatorData(result.creator);
        setIsNewProfile(false);
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        const result = await updateCreator(walletAddress, { username: username.trim() || undefined, bio: bio || undefined, socialLinks });
        setCreatorData(result.creator);
      }
      setSuccess(true);
      if (!isNewProfile) setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally { setSaving(false); }
  };

  if (status !== "connected" || !session) return <NotConnected />;
  if (loading) return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-2xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-lg bg-white/5" />
        <div className="h-64 rounded-2xl border border-white/5 bg-white/[0.03]" />
      </div>
    </div>
  );

  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <User className="size-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{isNewProfile ? "Create Your Profile" : "Edit Profile"}</h1>
              <p className="text-sm text-white/40">{isNewProfile ? "Set up your creator profile to start receiving tips" : "Update your public creator information"}</p>
            </div>
          </div>
        </motion.div>

        {/* Wallet */}
        <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Wallet className="size-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Wallet</h2>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5">
            <code className="flex-1 font-mono text-xs text-white/60 break-all">{walletAddress}</code>
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>

        {/* Basic Info */}
        <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2">
            <User className="size-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Basic Info</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/40">Username <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/25">@</span>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your-username"
                  className="w-full rounded-xl border border-white/5 bg-white/[0.04] pl-7 pr-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-500/30 transition-all" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/40">Bio</label>
              <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell your supporters about yourself..."
                className="w-full resize-none rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-500/30 transition-all" />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Link2 className="size-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Social Links</h2>
          </div>
          <div className="space-y-2.5">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform.key} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2.5 focus-within:border-emerald-500/20 transition-all">
                <Globe className="size-4 text-white/30 shrink-0" />
                <input type="url" value={socialLinks[platform.key] || ""} onChange={(e) => setSocialLinks((prev) => ({ ...prev, [platform.key]: e.target.value }))}
                  placeholder={platform.placeholder} className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20" />
                {socialLinks[platform.key] && <ArrowUpRight className="size-4 text-white/20 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-xs text-red-400">
            <AlertCircle className="size-3.5 shrink-0" /> {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleSave} disabled={saving || !username.trim()} className="flex-1 gap-2 rounded-xl">
            {saving ? <><Loader2 className="size-4 animate-spin" /> Saving...</> : success ? <><Check className="size-4" /> Saved!</> : <><Save className="size-4" /> {isNewProfile ? "Create Profile" : "Save Changes"}</>}
          </Button>
          {!isNewProfile && creatorData && (
            <a href={"/creator/" + creatorData.username}>
              <Button variant="outline" className="w-full gap-2 rounded-xl sm:w-auto"><ExternalLink className="size-4" /> View Profile</Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
