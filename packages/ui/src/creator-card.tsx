import { cn } from "./utils";

export interface CreatorCardProps {
  username: string;
  displayName?: string | null;
  bio?: string;
  avatarUrl?: string | null;
  totalTips: string;
  supporterCount: number;
  href?: string;
  className?: string;
}

export function CreatorCard({
  username,
  displayName,
  bio,
  avatarUrl,
  totalTips,
  supporterCount,
  href,
  className,
}: CreatorCardProps) {
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <a
      href={href ?? `/creator/${username}`}
      className={cn(
        "group block border border-[#D4D4D0] bg-white p-6 hover:bg-[#F9F9F7] transition-colors",
        className
      )}
    >
      <div className="flex items-center gap-4 border-b border-[#D4D4D0] pb-4 mb-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="size-11 border border-[#D4D4D0] bg-[#F9F9F7] object-cover"
          />
        ) : (
          <div className="size-11 flex items-center justify-center border border-[#D4D4D0] bg-[#F9F9F7] text-xs font-bold text-[#059669]">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#111111] truncate tracking-[-0.02em]">
            {displayName ?? username}
          </p>
          <p className="text-[10px] tracking-[0.08em] text-[#9CA3AF] truncate">@{username}</p>
        </div>
      </div>
      {bio && (
        <p className="text-xs text-[#888888] mb-6 leading-relaxed">
          {bio}
        </p>
      )}
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs font-bold text-[#111111]">{totalTips}</p>
          <p className="text-[9px] tracking-[0.1em] text-[#9CA3AF] uppercase">Earned</p>
        </div>
        <div>
          <p className="text-xs font-bold text-[#111111]">{supporterCount}</p>
          <p className="text-[9px] tracking-[0.1em] text-[#9CA3AF] uppercase">Supporters</p>
        </div>
      </div>
    </a>
  );
}
