"use client";

import { formatEther } from "viem";
import type { GameStatus } from "~~/types/game";

interface GameStatusCardsProps {
  game: GameStatus;
}

const GameStatusCards: React.FC<GameStatusCardsProps> = ({ game }) => {
  const getStatusColor = () => {
    return game.phase === 0 ? "text-primary" : "text-success";
  };

  const getStatusIcon = () => {
    return game.phase === 0 ? "📝" : "🗳️";
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
      <div className="stat bg-gradient-to-br from-base-200 to-base-300 rounded-lg sm:rounded-xl shadow-lg border border-base-content/10 p-2 sm:p-4">
        <div className="stat-figure text-lg sm:text-2xl">{getStatusIcon()}</div>
        <div className="stat-title text-xs font-medium">Game Status</div>
        <div className={`stat-value text-sm sm:text-lg ${getStatusColor()}`}>
          {game.phase === 0 ? "Collecting Items" : "Collecting Ranks"}
        </div>
      </div>

      <div className="stat bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg sm:rounded-xl shadow-lg border border-primary/20 p-2 sm:p-4">
        <div className="stat-figure text-lg sm:text-2xl">🎵</div>
        <div className="stat-title text-xs font-medium">Items</div>
        <div className="stat-value text-sm sm:text-lg text-primary">
          {game.itemsCount.toString()}/{game.numItems.toString()}
        </div>
        <div className="stat-desc">
          <progress
            className="progress progress-primary w-full h-1 sm:h-2"
            value={Number(game.itemsCount)}
            max={Number(game.numItems)}
          />
        </div>
      </div>

      <div className="stat bg-gradient-to-br from-accent/10 to-accent/20 rounded-lg sm:rounded-xl shadow-lg border border-accent/20 p-2 sm:p-4">
        <div className="stat-figure text-lg sm:text-2xl">🗳️</div>
        <div className="stat-title text-xs font-medium">Players</div>
        <div className="stat-value text-sm sm:text-lg text-accent">
          {game.playersCount.toString()}/{game.maxPlayers.toString()}
        </div>
      </div>

      <div className="stat bg-gradient-to-br from-secondary/10 to-secondary/20 rounded-lg sm:rounded-xl shadow-lg border border-secondary/20 p-2 sm:p-4">
        <div className="stat-figure text-lg sm:text-2xl">💰</div>
        <div className="stat-title text-xs font-medium">Prize Pool</div>
        <div className="stat-value text-sm sm:text-lg text-secondary">
          {parseFloat(formatEther(game.prizePool)).toFixed(4)} ETH
        </div>
      </div>
    </div>
  );
};

export default GameStatusCards;
