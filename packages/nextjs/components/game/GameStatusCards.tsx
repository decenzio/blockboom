"use client";

import { formatEther } from "viem";
import type { GameStatus } from "~~/types/game";

interface GameStatusCardsProps {
  game: GameStatus;
}

const GameStatusCards: React.FC<GameStatusCardsProps> = ({ game }) => {
  return (
    <div className="flex justify-center mb-6 sm:mb-8">
      <div className="stat bg-gradient-to-br from-secondary/10 to-secondary/20 rounded-lg sm:rounded-xl shadow-lg border border-secondary/20 p-4 sm:p-6">
        <div className="stat-figure text-2xl sm:text-3xl">💰</div>
        <div className="stat-title text-sm font-medium">Current Prize Pool</div>
        <div className="stat-value text-lg sm:text-2xl text-secondary">
          {parseFloat(formatEther(game.prizePool)).toFixed(4)} ETH
        </div>
      </div>
    </div>
  );
};

export default GameStatusCards;
