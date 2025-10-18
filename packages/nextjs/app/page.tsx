"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { AddSongCard, GameStatusCards, SongsListCard, VotingCard } from "~~/components/game";
import VotedConfirmationCard from "~~/components/game/VotedConfirmationCard";
import ActionShareCard from "~~/components/ui/ActionShareCard";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import type { GameStatus, Item, LoadingState } from "~~/types/game";

// Step navigation
type AppStep = "welcome" | "songs" | "voting";

// Main Component
const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [activeStep, setActiveStep] = useState<AppStep>("welcome");
  const [songRankings, setSongRankings] = useState<number[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    creatingGame: false,
    addingSong: false,
    voting: false,
  });
  const [showAddShare, setShowAddShare] = useState(false);
  const [showVoteShare, setShowVoteShare] = useState(false);

  // Contract reads - RankGame
  const { data: items } = useScaffoldReadContract({
    contractName: "RankGame",
    functionName: "getCurrentItems",
  });

  const { data: phase } = useScaffoldReadContract({
    contractName: "RankGame",
    functionName: "phase",
  });

  const { data: itemsCount } = useScaffoldReadContract({
    contractName: "RankGame",
    functionName: "itemsCount",
  });

  const { data: players } = useScaffoldReadContract({
    contractName: "RankGame",
    functionName: "getPlayers",
  });

  const { data: prizePool } = useScaffoldReadContract({
    contractName: "RankGame",
    functionName: "getPrizePool",
  });

  const { data: entryFee } = useScaffoldReadContract({
    contractName: "RankGame",
    functionName: "ENTRY_FEE",
  });

  const { data: numItems } = useScaffoldReadContract({
    contractName: "RankGame",
    functionName: "NUM_ITEMS",
  });

  const { data: maxPlayers } = useScaffoldReadContract({
    contractName: "RankGame",
    functionName: "MAX_PLAYERS",
  });

  const { data: userHasRanked } = useScaffoldReadContract({
    contractName: "RankGame",
    functionName: "hasRanked",
    args: connectedAddress ? [connectedAddress as `0x${string}`] : [undefined],
  });

  // Contract writes
  const { writeContractAsync: writeRankGame } = useScaffoldWriteContract("RankGame");

  // Parse game status
  const game: GameStatus | null = useMemo(() => {
    if (
      phase === undefined ||
      itemsCount === undefined ||
      players === undefined ||
      prizePool === undefined ||
      numItems === undefined ||
      maxPlayers === undefined ||
      entryFee === undefined
    ) {
      return null;
    }
    return {
      phase: Number(phase),
      itemsCount: Number(itemsCount),
      playersCount: Number((players as readonly string[] | undefined)?.length ?? 0),
      prizePool: prizePool as bigint,
      numItems: Number(numItems),
      maxPlayers: Number(maxPlayers),
      entryFee: entryFee as bigint,
    } as GameStatus;
  }, [entryFee, itemsCount, maxPlayers, numItems, phase, players, prizePool]);

  // Initialize song rankings when items change
  useEffect(() => {
    const nonEmptyItems = (items as readonly Item[] | undefined)?.filter(it => it && it.title);
    if (nonEmptyItems && nonEmptyItems.length > 0) {
      setSongRankings(Array.from({ length: nonEmptyItems.length }, (_, i) => i));
    }
  }, [items]);

  // Keep users on the welcome screen until they choose to proceed

  const handleAddSong = useCallback(
    async (title: string, author: string, url: string) => {
      setLoading(prev => ({ ...prev, addingSong: true }));
      try {
        await writeRankGame({
          functionName: "addItem",
          args: [{ author, title, url }],
        });
        setShowAddShare(true);
      } catch (error) {
        console.error("Error adding item:", error);
      } finally {
        setLoading(prev => ({ ...prev, addingSong: false }));
      }
    },
    [writeRankGame],
  );

  const handleVote = useCallback(
    async (amount: string, rankings: number[]) => {
      setLoading(prev => ({ ...prev, voting: true }));
      try {
        const orderTuple = [rankings[0] ?? 0, rankings[1] ?? 1, rankings[2] ?? 2] as const;
        await writeRankGame({
          functionName: "rankItems",
          args: [orderTuple],
          value: parseEther(amount),
        });
        setShowVoteShare(true);
      } catch (error) {
        console.error("Error voting:", error);
      } finally {
        setLoading(prev => ({ ...prev, voting: false }));
      }
    },
    [writeRankGame],
  );

  // All hooks above this point; render based on connection state below

  const canNavigateToVoting = useMemo(() => {
    if (!game) return false;
    const hasItems = !!(items as readonly Item[] | undefined)?.length;
    return Number(game.phase) === 1 && hasItems;
  }, [game, items]);

  if (!connectedAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl sm:text-8xl mb-4 sm:mb-6">🎵</div>
          <h1 className="text-3xl sm:text-5xl font-bold text-primary mb-3 sm:mb-4">BlockBoom</h1>
          <p className="text-lg sm:text-xl text-base-content/70 mb-6 sm:mb-8">
            Please connect your wallet to start playing!
          </p>
          <div className="animate-pulse">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary/20 rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const Stepper = (
    <div className="w-full mb-4 sm:mb-6">
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <button
          className={`btn btn-sm ${activeStep === "welcome" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveStep("welcome")}
          aria-label="Go to Welcome"
        >
          1. Welcome
        </button>
        <div className="opacity-50">→</div>
        <button
          className={`btn btn-sm ${activeStep === "songs" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveStep("songs")}
          aria-label="Go to Songs"
        >
          2. Songs
        </button>
        <div className="opacity-50">→</div>
        <button
          className={`btn btn-sm ${activeStep === "voting" ? "btn-primary" : "btn-outline"}`}
          onClick={() => canNavigateToVoting && setActiveStep("voting")}
          aria-disabled={!canNavigateToVoting}
        >
          3. Vote
        </button>
      </div>
      <p className="text-center text-xs sm:text-sm mt-2 text-base-content/60">
        {activeStep === "welcome" && "Review how it works, then continue."}
        {activeStep === "songs" &&
          (Number(game?.phase) === 0
            ? "Add songs or wait until the list is full."
            : "Song list is ready! Proceed to voting.")}
        {activeStep === "voting" && "Rank songs and place your bet."}
      </p>
    </div>
  );

  const WelcomeScreen = (
    <div className="space-y-4 sm:space-y-6">
      <div className="card bg-gradient-to-br from-base-200 to-base-300 p-4 sm:p-6 rounded-xl border border-base-content/10">
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-5xl sm:text-6xl mb-3">🎵</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Welcome to BlockBoom!</h2>
          <p className="text-sm sm:text-base text-base-content/70">The ultimate decentralized music voting game</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-primary/10 p-3 sm:p-4 rounded-lg">
            <h3 className="font-semibold text-primary mb-2 text-sm sm:text-base">🎮 How to Play</h3>
            <ol className="space-y-1 text-left text-sm">
              <li>1. Add your favorite songs (max {game?.numItems ?? 5})</li>
              <li>2. When full, rank all songs</li>
              <li>3. Place your ETH bet</li>
              <li>4. Winner takes the prize pool</li>
            </ol>
          </div>
          <div className="bg-accent/10 p-3 sm:p-4 rounded-lg">
            <h3 className="font-semibold text-accent mb-2 text-sm sm:text-base">📋 Rules</h3>
            <ul className="space-y-1 text-left text-sm">
              <li>• Entry fee: {game ? formatEther(game.entryFee) : "0.001"} ETH</li>
              <li>• Game ends when enough people voted</li>
              <li>• Each vote costs gas</li>
            </ul>
          </div>
        </div>
        <button
          className="btn btn-primary w-full mt-4 sm:mt-6 min-h-[44px]"
          onClick={() => setActiveStep("songs")}
          aria-label="Continue to songs"
        >
          Start →
        </button>
      </div>
    </div>
  );

  const SongsScreen = (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
      <div className="space-y-4 sm:space-y-6">
        {game && Number(game.phase) === 0 && game.itemsCount < game.numItems && (
          <AddSongCard onAddSong={handleAddSong} isLoading={loading.addingSong} />
        )}
        {showAddShare && (
          <ActionShareCard
            title="I just added a song to BlockBoom!"
            description="Join our game and add yours before voting starts."
            actionText="Share with friends"
            embedPath="/"
          />
        )}
      </div>
      <div className="space-y-4 sm:space-y-6">
        <SongsListCard
          songs={((items as readonly Item[]) || []).filter(it => it && it.title)}
          maxItems={game ? Number(game.numItems) : 5}
        />
        <button
          className="btn btn-secondary w-full"
          onClick={() => setActiveStep("voting")}
          disabled={!canNavigateToVoting}
        >
          {canNavigateToVoting ? "Proceed to Voting" : "Waiting for ranking phase"}
        </button>
      </div>
    </div>
  );

  const VotingScreen = (
    <div className="grid grid-cols-1 gap-4 sm:gap-6">
      {game && Number(game.phase) === 1 && items && (
        <>
          <VotingCard
            songs={((items as readonly Item[]) || []).filter(it => it && it.title)}
            rankings={songRankings}
            onRankingChange={newRanks => setSongRankings(newRanks)}
            onVote={handleVote}
            isLoading={loading.voting}
            entryFee={game ? formatEther(game.entryFee) : "0.001"}
          />
          {userHasRanked && <VotedConfirmationCard />}
          {showVoteShare && (
            <ActionShareCard
              title="I just voted on my top tracks!"
              description="Come rank songs and place your bet on BlockBoom."
              actionText="Share my vote"
              embedPath="/"
            />
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Game Status */}
        {game && <GameStatusCards game={game} />}
        {Stepper}

        {/* Screens */}
        {activeStep === "welcome" && WelcomeScreen}
        {activeStep === "songs" && SongsScreen}
        {activeStep === "voting" && VotingScreen}
      </div>
    </div>
  );
};

export default Home;
