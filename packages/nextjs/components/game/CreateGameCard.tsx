"use client";

import { useCallback } from "react";

interface CreateGameCardProps {
  onCreateGame: () => void;
  isLoading: boolean;
}

const CreateGameCard: React.FC<CreateGameCardProps> = ({ onCreateGame, isLoading }) => {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onCreateGame();
      }
    },
    [onCreateGame],
  );

  return (
    <div className="card bg-gradient-to-br from-primary/10 to-accent/10 shadow-xl border border-primary/20">
      <div className="card-body text-center p-4 sm:p-6">
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎮</div>
        <h2 className="card-title text-xl sm:text-2xl justify-center mb-2">Create New Game</h2>
        <p className="text-sm sm:text-base text-base-content/70 mb-4 sm:mb-6">
          Start a fresh BlockBoom session and invite friends to play!
        </p>
        <button
          className={`btn btn-primary btn-lg w-full min-h-[44px] ${isLoading ? "loading" : ""}`}
          onClick={onCreateGame}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          tabIndex={0}
          aria-label="Create a new BlockBoom game"
        >
          {isLoading ? "Creating..." : "Create Game"}
        </button>
      </div>
    </div>
  );
};

export default CreateGameCard;
