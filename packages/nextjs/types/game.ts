// Game-related types for BlockBoom

export interface Song {
  title: string;
  author: string;
  url: string;
  addedBy: string;
  votes: bigint;
}

export interface GameStatus {
  gameExists: boolean;
  gameActive: boolean;
  songCount: bigint;
  totalVotes: bigint;
  prizePool: bigint;
}

export interface LoadingState {
  creatingGame: boolean;
  addingSong: boolean;
  voting: boolean;
}
