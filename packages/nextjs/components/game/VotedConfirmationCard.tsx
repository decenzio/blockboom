"use client";

const VotedConfirmationCard: React.FC = () => {
  return (
    <div className="card bg-gradient-to-br from-success/20 to-success/30 shadow-xl border border-success/30">
      <div className="card-body text-center p-4 sm:p-6">
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">✅</div>
        <h2 className="card-title text-xl sm:text-2xl justify-center text-success mb-2">Vote Submitted!</h2>
        <p className="text-sm sm:text-base text-base-content/70">
          Youve successfully voted in this game. Waiting for other players to join...
        </p>
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-success/10 rounded-lg">
          <p className="text-xs sm:text-sm font-medium">Game will end when 10 people have voted</p>
        </div>
      </div>
    </div>
  );
};

export default VotedConfirmationCard;
