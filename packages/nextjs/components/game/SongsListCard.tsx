"use client";

import SongCard from "./SongCard";
import type { Item } from "~~/types/game";

interface SongsListCardProps {
  songs: Item[];
  maxItems: number;
}

const SongsListCard: React.FC<SongsListCardProps> = ({ songs, maxItems }) => {
  return (
    <div className="card bg-gradient-to-br from-base-200 to-base-300 shadow-xl border border-base-content/10">
      <div className="card-body p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="text-2xl sm:text-3xl">🎵</div>
          <h2 className="card-title text-lg sm:text-xl">Current Items</h2>
          <div className="badge badge-primary badge-sm sm:badge-lg">
            {songs.length}/{maxItems}
          </div>
        </div>

        {songs.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {songs.map((song, index) => (
              <SongCard key={index} song={song} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🎼</div>
            <p className="text-base-content/50 text-base sm:text-lg">No items added yet</p>
            <p className="text-base-content/30 text-xs sm:text-sm">Be the first to add an item!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongsListCard;
