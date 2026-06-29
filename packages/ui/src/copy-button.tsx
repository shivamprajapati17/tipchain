"use client";

import { useState, useCallback } from "react";
import { cn } from "./utils";

export interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 border border-[#D4D4D0] bg-white px-2.5 py-1 font-mono text-xs text-[#888888] hover:bg-[#F9F9F7] transition-colors",
        className
      )}
    >
      {label ?? text}
      <span className="text-[#059669] text-[10px] font-bold">
        {copied ? "COPIED" : "[CPY]"}
      </span>
    </button>
  );
}
