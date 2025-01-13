import { create } from "zustand";
import { GameState } from "./types";
import { Vector3 } from "three";

interface GameStore {
  gameState: GameState;
  setGameState: (state: GameState) => void;
}

interface PaintingStore {
  currentColor: string;
  setCurrentColor: (color: string) => void;
}

interface DistanceStore {
  targetPosition: Vector3;
  setTargetPosition: (position: Vector3) => void;
  position: Vector3;
  setPosition: (position: Vector3) => void;
}

const possibleTransitions: Record<GameState, GameState[]> = {
  start: ["normal"],
  normal: ["gameOver", "gameWon"],
  gameOver: [],
  gameWon: ["editor"],
  editor: [],
};

const useGameStore = create<GameStore>((set, get) => ({
  gameState: "start", // Initial state
  // gameState: "editor", // Initial state
  // kgameState: "gameWon", // Initial state
  setGameState: (state) => {
    const possibleStates = possibleTransitions[get().gameState];

    if (possibleStates.includes(state)) {
      set({ gameState: state });
    } else {
      console.warn(
        `Invalid state transition from ${get().gameState} to ${state}`
      );
    }
  },
}));

const usePaintingStore = create<PaintingStore>((set) => ({
  currentColor: "hsl(0, 100%, 50%)",
  setCurrentColor: (color) => {
    set({ currentColor: color });
  },
}));

const useDistanceStore = create<DistanceStore>((set) => ({
  targetPosition: new Vector3(),
  setTargetPosition: (position) => {
    set({ targetPosition: position });
  },
  position: new Vector3(),
  setPosition: (position) => {
    set({ position });
  },
}));

export { useGameStore, usePaintingStore, useDistanceStore };
