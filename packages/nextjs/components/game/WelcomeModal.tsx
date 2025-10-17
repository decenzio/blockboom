"use client";

import { useCallback } from "react";

interface WelcomeModalProps {
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div
        className="bg-gradient-to-br from-base-200 to-base-300 p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl max-w-lg w-full shadow-2xl border border-base-content/10 max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎵</div>
          <h2 id="welcome-title" className="text-2xl sm:text-3xl font-bold text-primary mb-2">
            Welcome to BlockBoom!
          </h2>
          <p className="text-sm sm:text-base text-base-content/70">The ultimate decentralized music voting game</p>
        </div>

        <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
          <div className="bg-primary/10 p-3 sm:p-4 rounded-lg">
            <h3 className="font-semibold text-primary mb-2 text-sm sm:text-base">🎮 How to Play</h3>
            <ol className="space-y-1 text-left">
              <li>1. Create a new game or join an existing one</li>
              <li>2. Add your favorite songs (max 5 per game)</li>
              <li>3. When full, rank all songs and place your ETH bet</li>
              <li>4. Winner takes the entire prize pool!</li>
            </ol>
          </div>

          <div className="bg-accent/10 p-3 sm:p-4 rounded-lg">
            <h3 className="font-semibold text-accent mb-2 text-sm sm:text-base">📋 Game Rules</h3>
            <ul className="space-y-1 text-left">
              <li>• Minimum bet: 0.001 ETH</li>
              <li>• Game ends when 10 people vote</li>
              <li>• Winner determined by song rankings</li>
              <li>• Each vote costs gas fees</li>
            </ul>
          </div>
        </div>

        <button
          className="btn btn-primary w-full mt-4 sm:mt-6 text-base sm:text-lg font-semibold min-h-[44px]"
          onClick={onClose}
          onKeyDown={e => e.key === "Enter" && onClose()}
          tabIndex={0}
          aria-label="Start playing BlockBoom"
        >
          Lets Rock! 🚀
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
