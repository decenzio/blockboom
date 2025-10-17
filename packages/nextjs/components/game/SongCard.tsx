"use client";

import { Address } from "~~/components/scaffold-eth";
import type { Item } from "~~/types/game";

interface SongCardProps {
  song: Item;
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
          {!isVoting && (song.adder || song.addedAt) && (
            <div className="mt-1 sm:mt-2 flex items-center gap-2 text-xs text-base-content/60">
              <span>Added by</span>
              {song.adder && <Address address={song.adder as `0x${string}`} size="xs" onlyEnsOrAddress />}
              {song.addedAt !== undefined && <span>• {new Date(Number(song.addedAt) * 1000).toLocaleString()}</span>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
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
                disabled={false}
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
