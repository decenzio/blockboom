"use client";

import { Address } from "~~/components/scaffold-eth";
import type { Song } from "~~/types/game";

interface SongCardProps {
  song: Song;
  index: number;
  isVoting?: boolean;
  rank?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const SongCard: React.FC<SongCardProps> = ({ song, isVoting = false, rank, onMoveUp, onMoveDown }) => {
  return (
    <div
      className={`group relative p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-lg ${
        isVoting ? "bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/30" : "bg-base-100"
      }`}
    >
      {isVoting && rank && (
        <div className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 w-6 h-6 sm:w-8 sm:h-8 bg-primary text-primary-content rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-lg">
          {rank}
        </div>
      )}

      <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base sm:text-lg truncate">{song.title}</h3>
          <p className="text-xs sm:text-sm text-base-content/70 truncate">{song.author}</p>
          <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
            <span className="text-xs text-base-content/50">Added by:</span>
            <Address address={song.addedBy as `0x${string}`} />
          </div>
          {song.url && (
            <div className="mt-1 sm:mt-2">
              <a
                href={song.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:text-primary-focus underline truncate block"
                tabIndex={0}
                aria-label={`Listen to ${song.title} by ${song.author}`}
              >
                🎵 Listen to song
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {!isVoting && (
            <div className="text-right">
              <div className="text-lg sm:text-2xl font-bold text-primary">{song.votes.toString()}</div>
              <div className="text-xs text-base-content/50">votes</div>
            </div>
          )}

          {isVoting && onMoveUp && onMoveDown && (
            <div className="flex flex-col gap-1">
              <button
                className="btn btn-xs btn-circle btn-ghost hover:btn-primary min-h-[32px] min-w-[32px]"
                onClick={onMoveUp}
                disabled={rank === 1}
                aria-label={`Move song up from position ${rank}`}
                tabIndex={0}
              >
                ↑
              </button>
              <button
                className="btn btn-xs btn-circle btn-ghost hover:btn-primary min-h-[32px] min-w-[32px]"
                onClick={onMoveDown}
                disabled={rank === 2}
                aria-label={`Move song down from position ${rank}`}
                tabIndex={0}
              >
                ↓
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongCard;
