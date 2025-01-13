import {
  Category,
  FilesetResolver,
  HandLandmarker,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { MutableRefObject, useEffect, useRef } from "react";
// @ts-expect-error - no types available
import hand_landmarker_task from "./assets/hand_landmarker.task";
import { RefLandmarks } from "../types";
import { useControls } from "leva";

type Props = {
  handLandmarkArrayRef: RefLandmarks;
  handednessRef: MutableRefObject<Category[][] | null>;
  numberOfHands?: number;
};

const HandRecognition = ({
  handLandmarkArrayRef,
  handednessRef,
  numberOfHands = 1,
}: Props) => {
  const { showVideo, showCanvas } = useControls({
    showVideo: false,
    showCanvas: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: null | number = null;

    const initializeHandDetection = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: hand_landmarker_task,
            delegate: "GPU",
          },
          numHands: numberOfHands,
          runningMode: "VIDEO",
          minTrackingConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minHandDetectionConfidence: 0.5,
        });
        detectHands();
      } catch (error) {
        console.error("Error initializing hand detection:", error);
      }
    };

    const drawLandmarks = (landmarksArray: NormalizedLandmark[][]) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";

      landmarksArray.forEach((landmarks) => {
        landmarks.forEach((landmark) => {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;

          ctx.beginPath();
          ctx.arc(x, y, 1, 0, 2 * Math.PI); // Draw a circle for each landmark
          ctx.fill();
        });
      });
    };

    const detectHands = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        handLandmarker != null
      ) {
        const detections = handLandmarker.detectForVideo(
          videoRef.current,
          performance.now()
        );

        if (detections.landmarks) {
          if (showCanvas) {
            drawLandmarks(detections.landmarks);
          }

          handLandmarkArrayRef.current = detections.landmarks;
          handednessRef.current = detections.handedness;
        } else {
          handLandmarkArrayRef.current = null;
          handednessRef.current = null;
        }
      }
      animationFrameId = requestAnimationFrame(detectHands);
    };

    const startWebcam = async () => {
      if (!videoRef.current) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
        await initializeHandDetection();
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };

    startWebcam();

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const videoElement = videoRef.current;

      if (videoElement && videoElement.srcObject instanceof MediaStream) {
        videoElement.srcObject.getTracks().forEach((track) => track.stop());
      }

      if (handLandmarker) {
        handLandmarker.close();
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [handLandmarkArrayRef, showCanvas]);

  return (
    <>
      <div style={{ position: "relative" }}>
        <video
          ref={videoRef}
          style={{ display: showVideo ? "block" : "none" }}
          autoPlay
          playsInline
          width="300px"
        ></video>
        {showCanvas && (
          <canvas
            ref={canvasRef}
            style={{
              backgroundColor: "black",
              width: "300px",
              height: "180px",
            }}
          />
        )}
      </div>
    </>
  );
};

export default HandRecognition;
