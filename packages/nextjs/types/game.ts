// Game-related types for Rankr

export interface Item {
  title: string;
  author: string;
  url: string;
  adder?: string;
  addedAt?: bigint | number;
}

export interface GameStatus {
  phase: number;
  itemsCount: number;
  playersCount: number;
  prizePool: bigint;
  numItems: number;
  maxPlayers: number;
  entryFee: bigint;
}

export interface LoadingState {
  creatingGame: boolean;
  addingSong: boolean;
  voting: boolean;
}
