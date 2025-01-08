import { NormalizedLandmark } from "@mediapipe/tasks-vision";

type VertexData = {
  initH: number;
  amplitude: number;
  phase: number;
};

type RefLandmarks = React.MutableRefObject<NormalizedLandmark[][] | null>;

export type { VertexData, RefLandmarks };
