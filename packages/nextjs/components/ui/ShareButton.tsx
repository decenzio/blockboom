"use client";

import { useCallback, useMemo, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { buildShareUrl } from "~~/lib/share";

type ShareIntent = {
  text: string;
  embedPath?: string; // e.g. `/share/123`
  embedUrl?: string; // absolute override
};

interface ShareButtonProps {
  label?: string;
  className?: string;
  intent: ShareIntent;
}

const ShareButton: React.FC<ShareButtonProps> = ({ label = "Share", className = "", intent }) => {
  const [isSharing, setIsSharing] = useState(false);

  const targetEmbed = useMemo(() => {
    if (intent.embedUrl) return intent.embedUrl;
    if (intent.embedPath) return buildShareUrl(intent.embedPath);
    return undefined;
  }, [intent.embedPath, intent.embedUrl]);

  const handleShare = useCallback(async () => {
    try {
      setIsSharing(true);
      await sdk.actions.composeCast({
        text: "Rank these songs! 🚀",
        embeds: [`https://blockboom-nextjs.vercel.app/share/dummy_fid`],
      });
    } catch (err) {
      console.error("Share failed", err);
    } finally {
      setIsSharing(false);
    }
  }, [intent.text, targetEmbed]);

  return (
    <button
      className={`btn btn-primary w-full min-h-[44px] ${className}`}
      onClick={handleShare}
      disabled={isSharing}
      aria-label="Share on Farcaster"
    >
      {isSharing ? "Sharing..." : label}
    </button>
  );
};

export default ShareButton;
