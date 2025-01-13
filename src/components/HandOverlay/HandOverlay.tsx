import { Category, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { MutableRefObject, useEffect, useRef } from "react";
import { usePaintingStore } from "../../store";

type Props = {
  handLandmarkArrayRef: MutableRefObject<NormalizedLandmark[][] | null>;
  handednessRef: MutableRefObject<Category[][] | null>;
};

export function HandOverlay({ handLandmarkArrayRef, handednessRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { currentColor } = usePaintingStore();

  const currentColorRef = useRef(currentColor);

  useEffect(() => {
    currentColorRef.current = currentColor;
  }, [currentColor]);

  const drawHand = (
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    color: string
  ) => {
    landmarks.forEach((landmark) => {
      ctx.beginPath();
      ctx.arc(
        (1 - landmark.x) * ctx.canvas.width,
        landmark.y * ctx.canvas.height,
        3,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = color;
      ctx.fill();
    });

    const connections = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4], // Thumb
      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8], // Index
      [5, 9],
      [9, 10],
      [10, 11],
      [11, 12], // Middle
      [9, 13],
      [13, 14],
      [14, 15],
      [15, 16], // Ring
      [13, 17],
      [17, 18],
      [18, 19],
      [19, 20], // Pinky
      [0, 17], // Palm
    ];

    connections.forEach(([start, end]) => {
      ctx.beginPath();
      ctx.moveTo(
        (1 - landmarks[start].x) * ctx.canvas.width, // Flip X coordinate
        landmarks[start].y * ctx.canvas.height
      );
      ctx.lineTo(
        (1 - landmarks[end].x) * ctx.canvas.width, // Flip X coordinate
        landmarks[end].y * ctx.canvas.height
      );
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  useEffect(() => {
    let animationFrameId: number;

    const updateHandsOverlay = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (handLandmarkArrayRef.current && handednessRef.current) {
        const handsWithHandedness = handLandmarkArrayRef.current.map(
          (landmarks, index) => ({
            landmarks,
            handedness: handednessRef.current![index],
          })
        );

        handsWithHandedness.forEach((hand) => {
          if (hand.handedness[0].categoryName === "Left") {
            drawHand(ctx, hand.landmarks, "gray"); // Left hand in gray
          } else if (hand.handedness[0].categoryName === "Right") {
            drawHand(ctx, hand.landmarks, currentColorRef.current); // Right hand in current color
          }
        });
      }

      animationFrameId = requestAnimationFrame(updateHandsOverlay);
    };

    updateHandsOverlay();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [handLandmarkArrayRef, handednessRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
      width={window.innerWidth}
      height={window.innerHeight}
    />
  );
}
