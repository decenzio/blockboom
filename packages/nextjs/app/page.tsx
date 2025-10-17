"use client";

import { useCallback, useEffect, useState } from "react";
import type { NextPage } from "next";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import {
  AddSongCard,
  CreateGameCard,
  GameStatusCards,
  SongsListCard,
  VotedConfirmationCard,
  VotingCard,
  WelcomeModal,
} from "~~/components/game";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import type { GameStatus, LoadingState, Song } from "~~/types/game";

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

  // Contract reads
  const { data: gameStatus } = useScaffoldReadContract({
    contractName: "BlockBoom",
    functionName: "getGameStatus",
  });

  const { data: songs } = useScaffoldReadContract({
    contractName: "BlockBoom",
    functionName: "getAllSongs",
  });

  const { data: userVote } = useScaffoldReadContract({
    contractName: "BlockBoom",
    functionName: "getUserVote",
    args: connectedAddress ? [connectedAddress as `0x${string}`] : [undefined],
  });

  // Contract writes
  const { writeContractAsync: writeBlockBoom } = useScaffoldWriteContract("BlockBoom");

  // Parse game status
  const game: GameStatus | null = gameStatus
    ? {
        gameExists: gameStatus[0],
        gameActive: gameStatus[1],
        songCount: gameStatus[2],
        totalVotes: gameStatus[3],
        prizePool: gameStatus[4],
      }
    : null;

  // Initialize song rankings when songs change
  useEffect(() => {
    if (songs && songs.length > 0) {
      setSongRankings(Array.from({ length: songs.length }, (_, i) => i));
    }
  }, [songs]);

  const handleCreateGame = useCallback(async () => {
    setLoading(prev => ({ ...prev, creatingGame: true }));
    try {
      await writeBlockBoom({
        functionName: "createGame",
      });
    } catch (error) {
      console.error("Error creating game:", error);
    } finally {
      setLoading(prev => ({ ...prev, creatingGame: false }));
    }
  }, [writeBlockBoom]);

  const handleAddSong = useCallback(
    async (title: string, author: string, url: string) => {
      setLoading(prev => ({ ...prev, addingSong: true }));
      try {
        await writeBlockBoom({
          functionName: "addSong",
          args: [title, author, url],
        });
      } catch (error) {
        console.error("Error adding song:", error);
      } finally {
        setLoading(prev => ({ ...prev, addingSong: false }));
      }
    },
    [writeBlockBoom],
  );

  const handleVote = useCallback(
    async (amount: string, rankings: number[]) => {
      setLoading(prev => ({ ...prev, voting: true }));
      try {
        await writeBlockBoom({
          functionName: "vote",
          args: [rankings.map(r => BigInt(r))],
          value: parseEther(amount),
        });
      } catch (error) {
        console.error("Error voting:", error);
      } finally {
        setLoading(prev => ({ ...prev, voting: false }));
      }
    },
    [writeBlockBoom],
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
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="text-6xl sm:text-8xl mb-3 sm:mb-4">🎵</div>
          <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3 sm:mb-4">
            BlockBoom
          </h1>
          <p className="text-lg sm:text-xl text-base-content/70 mb-4 sm:mb-6">
            Song of the Day - Decentralized Music Voting
          </p>
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-base-200 rounded-full">
            <span className="text-xs sm:text-sm text-base-content/70">Connected as:</span>
            <Address address={connectedAddress} />
          </div>
        </div>

        {/* Game Status */}
        {game && <GameStatusCards game={game} />}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Game Actions */}
          <div className="space-y-4 sm:space-y-6">
            {game && !game.gameExists && (
              <CreateGameCard onCreateGame={handleCreateGame} isLoading={loading.creatingGame} />
            )}

            {game && game.gameExists && game.gameActive && game.songCount < 5n && (
              <AddSongCard onAddSong={handleAddSong} isLoading={loading.addingSong} />
            )}

            {game && game.gameExists && game.gameActive && game.songCount === 5n && !userVote?.hasVoted && songs && (
              <VotingCard
                songs={songs as unknown as Song[]}
                rankings={songRankings}
                onRankingChange={handleRankingChange}
                onVote={handleVote}
                isLoading={loading.voting}
              />
            )}

            {userVote?.hasVoted && <VotedConfirmationCard />}
          </div>

          {/* Right Column - Songs List */}
          <div className="space-y-4 sm:space-y-6">
            <SongsListCard songs={(songs as unknown as Song[]) || []} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
