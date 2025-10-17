"use client";

import { useCallback, useEffect, useState } from "react";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { EtherInput } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

// Types
interface Song {
  title: string;
  author: string;
  url: string;
  addedBy: string;
  votes: bigint;
}

interface GameStatus {
  gameExists: boolean;
  gameActive: boolean;
  songCount: bigint;
  totalVotes: bigint;
  prizePool: bigint;
}

interface LoadingState {
  creatingGame: boolean;
  addingSong: boolean;
  voting: boolean;
}

// Component: Welcome Modal
const WelcomeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div
        className="bg-gradient-to-br from-base-200 to-base-300 p-8 rounded-2xl max-w-lg w-full shadow-2xl border border-base-content/10"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🎵</div>
          <h2 id="welcome-title" className="text-3xl font-bold text-primary mb-2">
            Welcome to BlockBoom!
          </h2>
          <p className="text-base-content/70">The ultimate decentralized music voting game</p>
        </div>

        <div className="space-y-4 text-sm">
          <div className="bg-primary/10 p-4 rounded-lg">
            <h3 className="font-semibold text-primary mb-2">🎮 How to Play</h3>
            <ol className="space-y-1 text-left">
              <li>1. Create a new game or join an existing one</li>
              <li>2. Add your favorite songs (max 5 per game)</li>
              <li>3. When full, rank all songs and place your ETH bet</li>
              <li>4. Winner takes the entire prize pool!</li>
            </ol>
          </div>

          <div className="bg-accent/10 p-4 rounded-lg">
            <h3 className="font-semibold text-accent mb-2">📋 Game Rules</h3>
            <ul className="space-y-1 text-left">
              <li>• Minimum bet: 0.001 ETH</li>
              <li>• Game ends when 10 people vote</li>
              <li>• Winner determined by song rankings</li>
              <li>• Each vote costs gas fees</li>
            </ul>
          </div>
        </div>

        <button
          className="btn btn-primary w-full mt-6 text-lg font-semibold"
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

// Component: Game Status Cards
const GameStatusCards: React.FC<{ game: GameStatus }> = ({ game }) => {
  const getStatusColor = () => {
    if (!game.gameExists) return "text-base-content/50";
    return game.gameActive ? "text-success" : "text-error";
  };

  const getStatusIcon = () => {
    if (!game.gameExists) return "⚪";
    return game.gameActive ? "🟢" : "🔴";
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="stat bg-gradient-to-br from-base-200 to-base-300 rounded-xl shadow-lg border border-base-content/10">
        <div className="stat-figure text-2xl">{getStatusIcon()}</div>
        <div className="stat-title text-xs font-medium">Game Status</div>
        <div className={`stat-value text-lg ${getStatusColor()}`}>
          {game.gameExists ? (game.gameActive ? "Active" : "Ended") : "No Game"}
        </div>
      </div>

      <div className="stat bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl shadow-lg border border-primary/20">
        <div className="stat-figure text-2xl">🎵</div>
        <div className="stat-title text-xs font-medium">Songs</div>
        <div className="stat-value text-lg text-primary">{game.songCount.toString()}/5</div>
        <div className="stat-desc">
          <progress className="progress progress-primary w-full h-2" value={Number(game.songCount)} max="5" />
        </div>
      </div>

      <div className="stat bg-gradient-to-br from-accent/10 to-accent/20 rounded-xl shadow-lg border border-accent/20">
        <div className="stat-figure text-2xl">🗳️</div>
        <div className="stat-title text-xs font-medium">Votes</div>
        <div className="stat-value text-lg text-accent">{game.totalVotes.toString()}/10</div>
        <div className="stat-desc">
          <progress className="progress progress-accent w-full h-2" value={Number(game.totalVotes)} max="10" />
        </div>
      </div>

      <div className="stat bg-gradient-to-br from-secondary/10 to-secondary/20 rounded-xl shadow-lg border border-secondary/20">
        <div className="stat-figure text-2xl">💰</div>
        <div className="stat-title text-xs font-medium">Prize Pool</div>
        <div className="stat-value text-lg text-secondary">
          {parseFloat(formatEther(game.prizePool)).toFixed(4)} ETH
        </div>
      </div>
    </div>
  );
};

// Component: Song Card
const SongCard: React.FC<{
  song: Song;
  index: number;
  isVoting?: boolean;
  rank?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}> = ({ song, isVoting = false, rank, onMoveUp, onMoveDown }) => {
  return (
    <div
      className={`group relative p-4 rounded-xl transition-all duration-300 hover:shadow-lg ${
        isVoting ? "bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/30" : "bg-base-100"
      }`}
    >
      {isVoting && rank && (
        <div className="absolute -top-2 -left-2 w-8 h-8 bg-primary text-primary-content rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
          {rank}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{song.title}</h3>
          <p className="text-sm text-base-content/70 truncate">{song.author}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-base-content/50">Added by:</span>
            <Address address={song.addedBy as `0x${string}`} />
          </div>
          {song.url && (
            <div className="mt-2">
              <a
                href={song.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:text-primary-focus underline truncate block"
                tabIndex={0}
                aria-label={`Listen to ${song.title} by ${song.author}`}
              >
                🎵 Listen to song
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!isVoting && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{song.votes.toString()}</div>
              <div className="text-xs text-base-content/50">votes</div>
            </div>
          )}

          {isVoting && onMoveUp && onMoveDown && (
            <div className="flex flex-col gap-1">
              <button
                className="btn btn-xs btn-circle btn-ghost hover:btn-primary"
                onClick={onMoveUp}
                disabled={rank === 1}
                aria-label={`Move song up from position ${rank}`}
                tabIndex={0}
              >
                ↑
              </button>
              <button
                className="btn btn-xs btn-circle btn-ghost hover:btn-primary"
                onClick={onMoveDown}
                disabled={rank === 5}
                aria-label={`Move song down from position ${rank}`}
                tabIndex={0}
              >
                ↓
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Component: Create Game Card
const CreateGameCard: React.FC<{ onCreateGame: () => void; isLoading: boolean }> = ({ onCreateGame, isLoading }) => {
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
      <div className="card-body text-center">
        <div className="text-6xl mb-4">🎮</div>
        <h2 className="card-title text-2xl justify-center mb-2">Create New Game</h2>
        <p className="text-base-content/70 mb-6">Start a fresh BlockBoom session and invite friends to play!</p>
        <button
          className={`btn btn-primary btn-lg w-full ${isLoading ? "loading" : ""}`}
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

// Component: Add Song Card
const AddSongCard: React.FC<{
  onAddSong: (title: string, author: string, url: string) => void;
  isLoading: boolean;
}> = ({ onAddSong, isLoading }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = useCallback(() => {
    if (title.trim() && author.trim() && url.trim()) {
      onAddSong(title.trim(), author.trim(), url.trim());
      setTitle("");
      setAuthor("");
      setUrl("");
    }
  }, [title, author, url, onAddSong]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const isDisabled = !title.trim() || !author.trim() || !url.trim() || isLoading;

  return (
    <div className="card bg-gradient-to-br from-accent/10 to-secondary/10 shadow-xl border border-accent/20">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🎵</div>
          <h2 className="card-title text-xl">Add Your Song</h2>
        </div>

        <div className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Song Title</span>
            </label>
            <input
              type="text"
              placeholder="Enter song title..."
              className="input input-bordered w-full focus:input-primary"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              tabIndex={0}
              aria-label="Song title input"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Author Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter author name..."
              className="input input-bordered w-full focus:input-primary"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              tabIndex={0}
              aria-label="Author name input"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Song URL</span>
            </label>
            <input
              type="url"
              placeholder="https://example.com/song.mp3"
              className="input input-bordered w-full focus:input-primary"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              tabIndex={0}
              aria-label="Song URL input"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">Link to the song (YouTube, SoundCloud, etc.)</span>
            </label>
          </div>

          <button
            className={`btn btn-accent w-full ${isLoading ? "loading" : ""}`}
            onClick={handleSubmit}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            tabIndex={0}
            aria-label="Add song to the game"
          >
            {isLoading ? "Adding..." : "Add Song"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Component: Voting Card
const VotingCard: React.FC<{
  songs: Song[];
  rankings: number[];
  onRankingChange: (rankings: number[]) => void;
  onVote: (amount: string, rankings: number[]) => void;
  isLoading: boolean;
}> = ({ songs, rankings, onRankingChange, onVote, isLoading }) => {
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
      <div className="card-body">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🗳️</div>
          <h2 className="card-title text-xl">Cast Your Vote</h2>
        </div>

        <p className="text-base-content/70 mb-6">Rank all songs from best to worst and place your ETH bet!</p>

        <div className="space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Bet Amount (ETH)</span>
            </label>
            <EtherInput value={voteAmount} onChange={setVoteAmount} placeholder="0.001" disabled={isLoading} />
            <label className="label">
              <span className="label-text-alt text-error">Minimum bet: 0.001 ETH</span>
            </label>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Rank Your Songs</h3>
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
            className={`btn btn-secondary btn-lg w-full ${isLoading ? "loading" : ""}`}
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

// Component: Voted Confirmation Card
const VotedConfirmationCard: React.FC = () => {
  return (
    <div className="card bg-gradient-to-br from-success/20 to-success/30 shadow-xl border border-success/30">
      <div className="card-body text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="card-title text-2xl justify-center text-success mb-2">Vote Submitted!</h2>
        <p className="text-base-content/70">
          Youve successfully voted in this game. Waiting for other players to join...
        </p>
        <div className="mt-4 p-4 bg-success/10 rounded-lg">
          <p className="text-sm font-medium">Game will end when 10 people have voted</p>
        </div>
      </div>
    </div>
  );
};

// Component: Songs List Card
const SongsListCard: React.FC<{ songs: Song[] }> = ({ songs }) => {
  return (
    <div className="card bg-gradient-to-br from-base-200 to-base-300 shadow-xl border border-base-content/10">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-3xl">🎵</div>
          <h2 className="card-title text-xl">Current Songs</h2>
          <div className="badge badge-primary badge-lg">{songs.length}/5</div>
        </div>

        {songs.length > 0 ? (
          <div className="space-y-3">
            {songs.map((song, index) => (
              <SongCard key={index} song={song} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎼</div>
            <p className="text-base-content/50 text-lg">No songs added yet</p>
            <p className="text-base-content/30 text-sm">Be the first to add a song!</p>
          </div>
        )}
      </div>
    </div>
  );
};

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
          <div className="text-8xl mb-6">🎵</div>
          <h1 className="text-5xl font-bold text-primary mb-4">BlockBoom</h1>
          <p className="text-xl text-base-content/70 mb-8">Please connect your wallet to start playing!</p>
          <div className="animate-pulse">
            <div className="w-32 h-32 bg-primary/20 rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
      {/* Welcome Modal */}
      {showInstructions && <WelcomeModal onClose={() => setShowInstructions(false)} />}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-8xl mb-4">🎵</div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            BlockBoom
          </h1>
          <p className="text-xl text-base-content/70 mb-6">Song of the Day - Decentralized Music Voting</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-base-200 rounded-full">
            <span className="text-sm text-base-content/70">Connected as:</span>
            <Address address={connectedAddress} />
          </div>
        </div>

        {/* Game Status */}
        {game && <GameStatusCards game={game} />}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column - Game Actions */}
          <div className="space-y-6">
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
          <div className="space-y-6">
            <SongsListCard songs={(songs as unknown as Song[]) || []} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
