"use client";

import { useState } from "react";
import { Facebook, Twitter, Link as LinkIcon, Check } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export const ShareButtons = ({ url, title }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "width=600,height=400");
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, "_blank", "width=600,height=400");
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-en-sans mr-2">Share</span>
      <button 
        onClick={shareFacebook}
        className="p-2.5 rounded-full border border-border hover:border-accent hover:text-accent transition-colors bg-background"
        aria-label="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
      </button>
      <button 
        onClick={shareTwitter}
        className="p-2.5 rounded-full border border-border hover:border-accent hover:text-accent transition-colors bg-background"
        aria-label="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </button>
      <button 
        onClick={handleCopy}
        className="p-2.5 rounded-full border border-border hover:border-accent hover:text-accent transition-colors bg-background relative group"
        aria-label="Copy link"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4" />}
        {copied && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-foreground text-background px-2 py-1 rounded font-en-sans whitespace-nowrap">
            Copied!
          </span>
        )}
      </button>
    </div>
  );
};
