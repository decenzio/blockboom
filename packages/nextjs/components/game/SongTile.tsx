"use client";

import { useCallback } from "react";
import Image from "next/image";
import type { Item } from "~~/types/game";

interface SongTileProps {
  song?: Item;
  index: number;
  isEmpty?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
  rankPosition?: number; // 1 for gold, 2 for silver, 3 for bronze, etc.
}

const SongTile: React.FC<SongTileProps> = ({
  song,
  index,
  isEmpty = false,
  onClick,
  isSelected = false,
  isDisabled = false,
  rankPosition,
}) => {
  const handleClick = useCallback(() => {
    if (!isDisabled && onClick) {
      onClick();
    }
  }, [isDisabled, onClick]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if ((event.key === "Enter" || event.key === " ") && !isDisabled && onClick) {
        event.preventDefault();
        onClick();
      }
    },
    [isDisabled, onClick],
  );

  // Get medal emoji based on rank position
  const getMedalEmoji = useCallback((position: number) => {
    switch (position) {
      case 1:
        return "🥇"; // Gold medal
      case 2:
        return "🥈"; // Silver medal
      case 3:
        return "🥉"; // Bronze medal
      default:
        return `${position}`; // For positions 4+
    }
  }, []);

  // Extract YouTube thumbnail URL
  const getYouTubeThumbnail = useCallback((url: string): string => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);

    if (match) {
      const videoId = match[1];
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    // Fallback for other video platforms or return a default image
    return "/placeholder-music.svg";
  }, []);

  if (isEmpty) {
    return (
      <div
        className={`
          w-full rounded-xl border-2 border-dashed border-base-content/30 
          flex items-center justify-center cursor-pointer transition-all duration-200
          hover:border-primary/50 hover:bg-primary/5 min-h-[120px]
          ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          ${isSelected ? "border-primary bg-primary/10" : ""}
        `}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={isDisabled ? -1 : 0}
        role="button"
        aria-label={`Add song at position ${index + 1}`}
      >
        <div className="text-center">
          <div className="text-4xl sm:text-5xl mb-2 text-base-content/40">+</div>
          <div className="text-sm text-base-content/60 font-medium">Add Song</div>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="w-full rounded-xl bg-base-200 border border-base-content/10 flex items-center justify-center min-h-[120px]">
        <div className="text-center">
          <div className="text-2xl sm:text-3xl mb-1 text-base-content/30">🎵</div>
          <div className="text-xs text-base-content/40">No song</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        w-full rounded-xl overflow-hidden cursor-pointer transition-all duration-200
        hover:shadow-lg hover:scale-[1.01] bg-base-100 border border-base-content/10
        ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
        ${isSelected ? "ring-2 ring-primary shadow-lg" : ""}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isDisabled ? -1 : 0}
      role="button"
      aria-label={`${song.title} by ${song.author}`}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Thumbnail */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            src={getYouTubeThumbnail(song.url)}
            alt={`${song.title} by ${song.author}`}
            fill
            className="object-cover"
            onError={e => {
              // Fallback to a music icon if thumbnail fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />

          {/* Fallback content */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
            style={{ display: "none" }}
          >
            <div className="text-center text-white">
              <div className="text-xl">🎵</div>
            </div>
          </div>
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg truncate">{song.title}</div>
          <div className="text-sm text-base-content/70 truncate">{song.author}</div>
        </div>

        {/* Selection indicator */}
        {isSelected && rankPosition && <div className="text-3xl flex-shrink-0">{getMedalEmoji(rankPosition)}</div>}
      </div>
    </div>
  );
};

export default SongTile;
