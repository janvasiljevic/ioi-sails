import {
  Category,
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import { MutableRefObject, useEffect, useRef } from "react";
// @ts-expect-error - no types available
import hand_landmarker_task from "./assets/hand_landmarker.task";
import { RefLandmarks } from "../types";
import { useControls } from "leva";

type Props = {
  handLandmarkArrayRef: RefLandmarks;
  handednessRef: MutableRefObject<Category[][] | null>;
};

const HandRecognitionVase = ({
  handLandmarkArrayRef,
  handednessRef,
}: Props) => {
  const { showVideo, showCanvas } = useControls({
    showVideo: false,
    showCanvas: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);

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
          numHands: 2, // COnfigurable number of hands
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

        // Assuming detections.landmarks is an array of landmark objects
        if (detections.landmarks) {
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
      </div>
    </>
  );
};

export default HandRecognitionVase;
