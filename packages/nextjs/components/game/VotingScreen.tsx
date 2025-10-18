"use client";

import { useCallback, useState } from "react";
import SongTile from "./SongTile";
import type { Item } from "~~/types/game";

interface VotingScreenProps {
  songs: Item[];
  rankings: number[];
  onRankingChange: (rankings: number[]) => void;
  onVote: (amount: string, rankings: number[]) => void;
  isLoading: boolean;
  entryFee: string;
}

const VotingScreen: React.FC<VotingScreenProps> = ({
  songs,
  rankings,
  onRankingChange,
  onVote,
  isLoading,
  entryFee,
}) => {
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);

  // Initialize with empty rankings - don't sync with external rankings
  // This ensures the voting screen always starts fresh

  const handleTileClick = useCallback(
    (index: number) => {
      if (isLoading) return;

      const songIndex = index;
      const isSelected = selectedTiles.includes(songIndex);

      if (isSelected) {
        // Remove from selection - remove only this specific song
        const newSelected = selectedTiles.filter(i => i !== songIndex);
        setSelectedTiles(newSelected);

        // Remove from rankings - remove only this specific song
        const newRankings = rankings.filter(rank => rank !== songIndex);
        onRankingChange(newRankings);
      } else if (selectedTiles.length < songs.length) {
        // Add to selection - add to the end of the current ranking
        const newSelected = [...selectedTiles, songIndex];
        setSelectedTiles(newSelected);

        // Add to rankings
        const newRankings = [...rankings, songIndex];
        onRankingChange(newRankings);
      }
    },
    [isLoading, selectedTiles, rankings, songs.length, onRankingChange],
  );

  const handleSubmitVote = useCallback(() => {
    if (rankings.length === songs.length) {
      onVote(entryFee, rankings);
    }
  }, [rankings, songs.length, onVote, entryFee]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmitVote();
      }
    },
    [handleSubmitVote],
  );

  const isDisabled = isLoading || rankings.length !== songs.length;

  // Create array of tiles with rank positions
  const tiles = Array.from({ length: songs.length }, (_, index) => {
    const song = songs[index];
    const isSelected = selectedTiles.includes(index);
    const rankPosition = isSelected ? rankings.indexOf(index) + 1 : undefined;

    return {
      song,
      index,
      isSelected,
      rankPosition,
    };
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">Top 5 RANKr</h1>
        <p className="text-base-content/70">Tap songs in order from BEST to WORST. Tap again to remove from ranking.</p>
      </div>

      {/* Tiles Grid */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {tiles.map(({ song, index, isSelected, rankPosition }) => (
          <SongTile
            key={index}
            song={song}
            index={index}
            onClick={() => handleTileClick(index)}
            isSelected={isSelected}
            isDisabled={isLoading}
            rankPosition={rankPosition}
          />
        ))}
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <button
          className={`btn btn-primary btn-xl min-h-[80px] px-8 py-6 ${isLoading ? "loading" : ""}`}
          onClick={handleSubmitVote}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          tabIndex={0}
          aria-label="Submit your ranking"
        >
          {isLoading ? "Submitting..." : `Submit your ranking for a chance to win! 🚀`}
        </button>

        {rankings.length < songs.length && (
          <p className="text-sm text-base-content/60 mt-3">Select all {songs.length} songs to submit your ranking</p>
        )}
      </div>
    </div>
  );
};

export default VotingScreen;
