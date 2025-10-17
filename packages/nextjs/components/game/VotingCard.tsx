"use client";

import { useCallback, useState } from "react";
import SongCard from "./SongCard";
import { EtherInput } from "~~/components/scaffold-eth";
import type { Song } from "~~/types/game";

interface VotingCardProps {
  songs: Song[];
  rankings: number[];
  onRankingChange: (rankings: number[]) => void;
  onVote: (amount: string, rankings: number[]) => void;
  isLoading: boolean;
}

const VotingCard: React.FC<VotingCardProps> = ({ songs, rankings, onRankingChange, onVote, isLoading }) => {
  const [voteAmount, setVoteAmount] = useState("0.001");

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const newRankings = [...rankings];
      [newRankings[index - 1], newRankings[index]] = [newRankings[index], newRankings[index - 1]];
      onRankingChange(newRankings);
    },
    [rankings, onRankingChange],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index === rankings.length - 1) return;
      const newRankings = [...rankings];
      [newRankings[index], newRankings[index + 1]] = [newRankings[index + 1], newRankings[index]];
      onRankingChange(newRankings);
    },
    [rankings, onRankingChange],
  );

  const handleSubmitVote = useCallback(() => {
    if (voteAmount && parseFloat(voteAmount) >= 0.001) {
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

  const isDisabled = !voteAmount || parseFloat(voteAmount) < 0.001 || isLoading;

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
            <EtherInput value={voteAmount} onChange={setVoteAmount} placeholder="0.001" disabled={isLoading} />
            <label className="label">
              <span className="label-text-alt text-xs sm:text-sm text-error">Minimum bet: 0.001 ETH</span>
            </label>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-base sm:text-lg">Rank Your Songs</h3>
            <div className="space-y-2">
              {songs &&
                rankings.map((songIndex, rankIndex) => (
                  <SongCard
                    key={songIndex}
                    song={songs[songIndex]}
                    index={songIndex}
                    isVoting={true}
                    rank={rankIndex + 1}
                    onMoveUp={() => handleMoveUp(rankIndex)}
                    onMoveDown={() => handleMoveDown(rankIndex)}
                  />
                ))}
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
