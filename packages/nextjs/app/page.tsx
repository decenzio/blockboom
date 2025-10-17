"use client";

import { useCallback, useEffect, useState } from "react";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { AddSongCard, GameStatusCards, SongsListCard, VotingCard, WelcomeModal } from "~~/components/game";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import type { GameStatus, Item, LoadingState } from "~~/types/game";

// Main Component
const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [showInstructions, setShowInstructions] = useState(true);
  const [songRankings, setSongRankings] = useState<number[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    creatingGame: false,
    addingSong: false,
    voting: false,
  });

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
  const game: GameStatus | null =
    phase !== undefined &&
    itemsCount !== undefined &&
    players !== undefined &&
    prizePool !== undefined &&
    numItems !== undefined &&
    maxPlayers !== undefined &&
    entryFee !== undefined
      ? {
          phase: Number(phase),
          itemsCount: Number(itemsCount),
          playersCount: Number((players as readonly string[] | undefined)?.length ?? 0),
          prizePool: prizePool as bigint,
          numItems: Number(numItems),
          maxPlayers: Number(maxPlayers),
          entryFee: entryFee as bigint,
        }
      : null;

  // Initialize song rankings when items change
  useEffect(() => {
    const nonEmptyItems = (items as readonly Item[] | undefined)?.filter(it => it && it.title);
    if (nonEmptyItems && nonEmptyItems.length > 0) {
      setSongRankings(Array.from({ length: nonEmptyItems.length }, (_, i) => i));
    }
  }, [items]);

  // placeholder

  const handleAddSong = useCallback(
    async (title: string, author: string, url: string) => {
      setLoading(prev => ({ ...prev, addingSong: true }));
      try {
        await writeRank5({
          functionName: "addItem",
          args: [{ author, title, url }],
        });
      } catch (error) {
        console.error("Error adding item:", error);
      } finally {
        setLoading(prev => ({ ...prev, addingSong: false }));
      }
    },
    [writeRank5],
  );

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
      } catch (error) {
        console.error("Error voting:", error);
      } finally {
        setLoading(prev => ({ ...prev, voting: false }));
      }
    },
    [writeRank5],
  );

  const handleRankingChange = useCallback((newRankings: number[]) => {
    setSongRankings(newRankings);
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
      {/* Welcome Modal */}
      {showInstructions && <WelcomeModal onClose={() => setShowInstructions(false)} />}

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Game Status */}
        {game && <GameStatusCards game={game} />}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Game Actions */}
          <div className="space-y-4 sm:space-y-6">
            {game && Number(game.phase) === 0 && game.itemsCount < game.numItems && (
              <AddSongCard onAddSong={handleAddSong} isLoading={loading.addingSong} />
            )}

            {game && Number(game.phase) === 1 && items && (
              <VotingCard
                songs={((items as readonly Item[]) || []).filter(it => it && it.title)}
                rankings={songRankings}
                onRankingChange={handleRankingChange}
                onVote={handleVote}
                isLoading={loading.voting}
                entryFee={game ? formatEther(game.entryFee) : "0.001"}
              />
            )}
            {userHasRanked && <div className="alert alert-success">You already ranked this round.</div>}
          </div>

          {/* Right Column - Items List */}
          <div className="space-y-4 sm:space-y-6">
            <SongsListCard
              songs={((items as readonly Item[]) || []).filter(it => it && it.title)}
              maxItems={game ? Number(game.numItems) : 5}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
