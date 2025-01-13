import { NormalizedLandmark } from "@mediapipe/tasks-vision";

type GameState = "normal" | "gameOver" | "gameWon" | "editor" | "start";
type RefLandmarks = React.MutableRefObject<NormalizedLandmark[][] | null>;

export type { GameState, RefLandmarks };
