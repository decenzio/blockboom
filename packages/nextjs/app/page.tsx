"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import SongsScreen from "~~/components/game/SongsScreen";
import TransactionSuccessOverlay from "~~/components/game/TransactionSuccessOverlay";
import VotedConfirmationCard from "~~/components/game/VotedConfirmationCard";
import VotingScreen from "~~/components/game/VotingScreen";
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
  const [shouldRedirectToVoting, setShouldRedirectToVoting] = useState(false);

  // Contract reads - Rank5Game
  const { data: items } = useScaffoldReadContract({
    contractName: "Rank5Game",
    functionName: "getCurrentItems",
  });

  const { data: phase } = useScaffoldReadContract({
    contractName: "Rank5Game",
    functionName: "phase",
  });

  const { data: itemsCount } = useScaffoldReadContract({
    contractName: "Rank5Game",
    functionName: "itemsCount",
  });

  const { data: players } = useScaffoldReadContract({
    contractName: "Rank5Game",
    functionName: "getPlayers",
  });

  const { data: prizePool } = useScaffoldReadContract({
    contractName: "Rank5Game",
    functionName: "getPrizePool",
  });

  const { data: entryFee } = useScaffoldReadContract({
    contractName: "Rank5Game",
    functionName: "ENTRY_FEE",
  });

  const { data: numItems } = useScaffoldReadContract({
    contractName: "Rank5Game",
    functionName: "NUM_ITEMS",
  });

  const { data: maxPlayers } = useScaffoldReadContract({
    contractName: "Rank5Game",
    functionName: "MAX_PLAYERS",
  });

  const { data: userHasRanked } = useScaffoldReadContract({
    contractName: "Rank5Game",
    functionName: "hasRanked",
    args: connectedAddress ? [connectedAddress as `0x${string}`] : [undefined],
  });

  // Contract writes
  const { writeContractAsync: writeRank5 } = useScaffoldWriteContract("Rank5Game");

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
      // Only auto-populate rankings if we're not on the voting screen
      // This allows the voting screen to start with empty rankings
      if (activeStep !== "voting") {
        setSongRankings(Array.from({ length: nonEmptyItems.length }, (_, i) => i));
      }
    }
  }, [items, activeStep]);

  // Clear rankings when entering voting screen to start fresh
  useEffect(() => {
    if (activeStep === "voting") {
      setSongRankings([]);
    }
  }, [activeStep]);

  // Automatically switch to voting screen when phase changes to 1
  useEffect(() => {
    if (game && Number(game.phase) === 1 && activeStep === "songs") {
      setActiveStep("voting");
    }
  }, [game, activeStep]);

  // Keep users on the welcome screen until they choose to proceed

  const handleAddSong = useCallback(
    async (title: string, author: string, url: string) => {
      setLoading(prev => ({ ...prev, addingSong: true }));
      try {
        await writeRank5({
          functionName: "addItem",
          args: [{ author, title, url }],
        });

        // Check if this was the final song (current count + 1 equals max items)
        const currentCount = (items as readonly Item[] | undefined)?.filter(it => it && it.title).length ?? 0;
        const maxItems = game ? Number(game.numItems) : 5;

        if (currentCount + 1 >= maxItems) {
          setShouldRedirectToVoting(true);
        }

        setShowAddShare(true);
      } catch (error) {
        console.error("Error adding item:", error);
      } finally {
        setLoading(prev => ({ ...prev, addingSong: false }));
      }
    },
    [writeRank5, items, game],
  );

  const handleCloseAddShare = useCallback(() => {
    setShowAddShare(false);
    if (shouldRedirectToVoting) {
      setShouldRedirectToVoting(false);
      setActiveStep("voting");
    }
  }, [shouldRedirectToVoting]);

  const handleVote = useCallback(
    async (amount: string, rankings: number[]) => {
      setLoading(prev => ({ ...prev, voting: true }));
      try {
        const orderTuple = [rankings[0] ?? 0, rankings[1] ?? 1, rankings[2] ?? 2] as const;
        await writeRank5({
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
    [writeRank5],
  );

  // After your app is fully loaded and ready to display
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  // All hooks above this point; render based on connection state below

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

  const SongsScreenContent = (
    <div className="space-y-6">
      <SongsScreen
        songs={((items as readonly Item[]) || []).filter(it => it && it.title)}
        maxItems={game ? Number(game.numItems) : 5}
        onAddSong={handleAddSong}
        isLoading={loading.addingSong}
      />
    </div>
  );

  const VotingScreenContent = (
    <div className="space-y-6">
      {game && Number(game.phase) === 1 && items && (
        <>
          <VotingScreen
            songs={((items as readonly Item[]) || []).filter(it => it && it.title)}
            rankings={songRankings}
            onRankingChange={newRanks => setSongRankings(newRanks)}
            onVote={handleVote}
            isLoading={loading.voting}
            entryFee={game ? formatEther(game.entryFee) : "0.001"}
          />

          {userHasRanked && <VotedConfirmationCard />}
        </>
      )}
      {game && Number(game.phase) !== 1 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-semibold mb-2">Waiting for Voting Phase</h2>
          <p className="text-base-content/70">The voting phase will begin automatically when all songs are added.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Screens */}
        {activeStep === "welcome" && WelcomeScreen}
        {activeStep === "songs" && SongsScreenContent}
        {activeStep === "voting" && VotingScreenContent}
      </div>

      {/* Transaction Success Overlays */}
      <TransactionSuccessOverlay
        isOpen={showAddShare}
        onClose={handleCloseAddShare}
        title="I just added a song to BlockBoom!"
        description="Join our game and add yours before voting starts."
        actionText="Share with friends"
        embedPath="/"
      />

      <TransactionSuccessOverlay
        isOpen={showVoteShare}
        onClose={() => setShowVoteShare(false)}
        title="I just voted on my top tracks!"
        description="Come rank songs and place your bet on BlockBoom."
        actionText="Share my vote"
        embedPath="/"
      />
    </div>
  );
};

export default Home;
