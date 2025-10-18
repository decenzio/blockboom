"use client";

import { useCallback, useState } from "react";
import AddSongDialog from "./AddSongDialog";
import SongTile from "./SongTile";
import type { Item } from "~~/types/game";

interface SongsScreenProps {
  songs: Item[];
  maxItems: number;
  onAddSong: (title: string, author: string, url: string) => void;
  isLoading: boolean;
}

const SongsScreen: React.FC<SongsScreenProps> = ({ songs, maxItems, onAddSong, isLoading }) => {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleTileClick = useCallback(
    (index: number) => {
      // If this tile is empty and we're still in song selection phase
      if (index >= songs.length && songs.length < maxItems) {
        setShowAddDialog(true);
      }
    },
    [songs.length, maxItems],
  );

  const handleAddSong = useCallback(
    (title: string, author: string, url: string) => {
      onAddSong(title, author, url);
      setShowAddDialog(false);
    },
    [onAddSong],
  );

  const handleCloseDialog = useCallback(() => {
    setShowAddDialog(false);
  }, []);

  // Create array of 5 tiles
  const tiles = Array.from({ length: maxItems }, (_, index) => {
    const song = songs[index];
    const isEmpty = index >= songs.length;

    return {
      song,
      isEmpty,
      index,
    };
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">Top 5 RANKr</h1>
        <p className="text-base-content/70">Submit a song to be ranked!</p>
      </div>

      {/* Tiles Grid */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {tiles.map(({ song, isEmpty, index }) => (
          <SongTile
            key={index}
            song={song}
            index={index}
            isEmpty={isEmpty}
            onClick={() => handleTileClick(index)}
            isDisabled={isLoading}
          />
        ))}
      </div>

      {/* Status Message */}
      {songs.length < maxItems && (
        <div className="text-center">
          <p className="text-sm text-base-content/60">Once all slots are filled, voting will begin!</p>
        </div>
      )}

      {/* Add Song Dialog */}
      <AddSongDialog
        isOpen={showAddDialog}
        onClose={handleCloseDialog}
        onSubmit={handleAddSong}
        isLoading={isLoading}
      />
    </div>
  );
};

export default SongsScreen;
