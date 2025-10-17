"use client";

import { useCallback, useMemo, useState } from "react";
import SongCard from "./SongCard";
import { EtherInput } from "~~/components/scaffold-eth";
import type { Item } from "~~/types/game";

interface VotingCardProps {
  songs: Item[];
  rankings: number[];
  onRankingChange: (rankings: number[]) => void;
  onVote: (amount: string, rankings: number[]) => void;
  isLoading: boolean;
  entryFee: string;
}

const VotingCard: React.FC<VotingCardProps> = ({ songs, rankings, onRankingChange, onVote, isLoading, entryFee }) => {
  const [voteAmount, setVoteAmount] = useState(entryFee);
  const [draggingRankIndex, setDraggingRankIndex] = useState<number | null>(null);
  const [dragOverRankIndex, setDragOverRankIndex] = useState<number | null>(null);
  const [keyboardDraggingIndex, setKeyboardDraggingIndex] = useState<number | null>(null);

  const moveItem = useCallback((list: number[], from: number, to: number) => {
    if (from === to) return list;
    const updated = [...list];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    return updated;
  }, []);

  const handleDragStart = useCallback(
    (index: number) => {
      if (isLoading) return;
      setDraggingRankIndex(index);
    },
    [isLoading],
  );

  const handleDragOverItem = useCallback(
    (event: React.DragEvent<HTMLDivElement>, overIndex: number) => {
      if (draggingRankIndex === null) return;
      event.preventDefault();
      if (overIndex !== dragOverRankIndex) {
        setDragOverRankIndex(overIndex);
      }
    },
    [draggingRankIndex, dragOverRankIndex],
  );

  const handleDropOnItem = useCallback(
    (overIndex: number) => {
      if (draggingRankIndex === null) return;
      const updated = moveItem(rankings, draggingRankIndex, overIndex);
      onRankingChange(updated);
      setDraggingRankIndex(null);
      setDragOverRankIndex(null);
    },
    [draggingRankIndex, moveItem, onRankingChange, rankings],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingRankIndex(null);
    setDragOverRankIndex(null);
  }, []);

  const handleSubmitVote = useCallback(() => {
    if (voteAmount) {
      onVote(voteAmount, rankings);
    }
  }, [voteAmount, rankings, onVote]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmitVote();
      }
    },
    [handleSubmitVote],
  );

  const isDisabled = !voteAmount || isLoading;

  const handleItemKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, currentIndex: number) => {
      // Start keyboard drag with Space or Enter when not already dragging
      if (keyboardDraggingIndex === null && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        setKeyboardDraggingIndex(currentIndex);
        return;
      }

      // Cancel keyboard drag with Escape
      if (keyboardDraggingIndex !== null && event.key === "Escape") {
        event.preventDefault();
        setKeyboardDraggingIndex(null);
        return;
      }

      // Commit keyboard drag with Enter/Space
      if (keyboardDraggingIndex !== null && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        setKeyboardDraggingIndex(null);
        return;
      }

      if (keyboardDraggingIndex === null) return;

      // Reorder with arrow keys while dragging
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (keyboardDraggingIndex <= 0) return;
        const updated = moveItem(rankings, keyboardDraggingIndex, keyboardDraggingIndex - 1);
        onRankingChange(updated);
        setKeyboardDraggingIndex(prev => (prev === null ? null : prev - 1));
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (keyboardDraggingIndex >= rankings.length - 1) return;
        const updated = moveItem(rankings, keyboardDraggingIndex, keyboardDraggingIndex + 1);
        onRankingChange(updated);
        setKeyboardDraggingIndex(prev => (prev === null ? null : prev + 1));
        return;
      }
    },
    [keyboardDraggingIndex, moveItem, onRankingChange, rankings],
  );

  const announcement = useMemo(() => {
    if (draggingRankIndex !== null && dragOverRankIndex !== null) {
      const song = songs[rankings[draggingRankIndex]];
      const position = dragOverRankIndex + 1;
      return `Moving ${song?.title} to position ${position}`;
    }
    return "";
  }, [dragOverRankIndex, draggingRankIndex, rankings, songs]);

  return (
    <div className="card bg-gradient-to-br from-secondary/10 to-primary/10 shadow-xl border border-secondary/20">
      <div className="card-body p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <div className="text-2xl sm:text-3xl">🗳️</div>
          <h2 className="card-title text-lg sm:text-xl">Cast Your Vote</h2>
        </div>

        <p className="text-sm sm:text-base text-base-content/70 mb-4 sm:mb-6">
          Rank all songs from best to worst and place your ETH bet!
        </p>

        <div className="space-y-4 sm:space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-sm sm:text-base">Bet Amount (ETH)</span>
            </label>
            <EtherInput value={voteAmount} onChange={setVoteAmount} placeholder={entryFee} disabled={true} />
            <label className="label">
              <span className="label-text-alt text-xs sm:text-sm text-error">Fixed fee: {entryFee} ETH</span>
            </label>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-base sm:text-lg">Rank Your Songs</h3>
            <p className="sr-only" aria-live="polite">
              {announcement}
            </p>
            <div className="space-y-2" role="list" aria-label="Ranked list. Drag and drop or use keyboard to reorder.">
              {songs &&
                rankings.map((songIndex, rankIndex) => {
                  const isDraggingItem = draggingRankIndex === rankIndex || keyboardDraggingIndex === rankIndex;
                  const isDropTarget = dragOverRankIndex === rankIndex && draggingRankIndex !== null;
                  return (
                    <div
                      key={songIndex}
                      role="listitem"
                      aria-roledescription="Draggable item"
                      aria-grabbed={isDraggingItem}
                      aria-describedby={`song-${songIndex}-hint`}
                      draggable={!isLoading}
                      onDragStart={() => handleDragStart(rankIndex)}
                      onDragOver={e => handleDragOverItem(e, rankIndex)}
                      onDrop={() => handleDropOnItem(rankIndex)}
                      onDragEnd={handleDragEnd}
                      onKeyDown={e => handleItemKeyDown(e, rankIndex)}
                      tabIndex={0}
                      className={`select-none rounded-xl transition-all duration-200 ease-out ${
                        isDraggingItem ? "ring-2 ring-primary/60 scale-[0.99]" : ""
                      } ${isDropTarget ? "ring-2 ring-accent" : ""}`}
                    >
                      <div id={`song-${songIndex}-hint`} className="sr-only">
                        Press Space or Enter to start reordering with keyboard. Use Arrow keys to move. Press Enter to
                        drop.
                      </div>
                      <div className="flex items-stretch gap-2">
                        <div
                          className="flex items-center justify-center px-2 cursor-grab active:cursor-grabbing text-base-content/60"
                          aria-hidden
                        >
                          ↕
                        </div>
                        <div className="flex-1">
                          <SongCard song={songs[songIndex]} index={songIndex} isVoting={true} rank={rankIndex + 1} />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <button
            className={`btn btn-secondary btn-lg w-full min-h-[44px] text-sm sm:text-base ${isLoading ? "loading" : ""}`}
            onClick={handleSubmitVote}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            tabIndex={0}
            aria-label="Submit your vote with ranking and bet amount"
          >
            {isLoading ? "Submitting..." : "Submit Vote"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotingCard;
