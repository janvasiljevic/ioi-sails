import { Category, NormalizedLandmark } from "@mediapipe/tasks-vision";
import {
  AccumulativeShadows,
  Environment,
  PerspectiveCamera,
  RandomizedLight,
  Sky,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import HandRecognitionVase from "../recognition/HandRecognitionVase";

type RefLandmarks = {
  current: NormalizedLandmark[][] | null;
};

type RefHandedness = {
  current: Category[][] | null;
};

function PaintableVase({
  handLandmarkArrayRef,
  handednessRef,
}: {
  handLandmarkArrayRef: RefLandmarks;
  handednessRef: RefHandedness;
}) {
  const { nodes } = useGLTF("/vase.glb");
  const meshRef = useRef<THREE.Mesh>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const [rotationY, setRotationY] = useState(0);
  const { camera } = useThree();
  const raycaster = new THREE.Raycaster();

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext("2d");
    if (context) {
      context.rect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "white";
      context.fill();
    }
  }, []);

  useFrame(() => {
    if (
      !handLandmarkArrayRef.current ||
      !handednessRef.current ||
      !meshRef.current
    )
      return;

    // Map hands to their handedness
    const handsWithHandedness = handLandmarkArrayRef.current.map(
      (landmarks, index) => ({
        landmarks,
        handedness: handednessRef.current![index][0].categoryName,
      })
    );

    // Find right hand for painting
    const rightHand = handsWithHandedness.find(
      (hand) => hand.handedness === "Right"
    )?.landmarks;
    if (rightHand) {
      const rightIndex = rightHand[8]; // Index finger tip
      if (rightIndex) {
        // Convert normalized coordinates to clip space (-1 to 1)
        const clipX = (1 - rightIndex.x) * 2 - 1;
        const clipY = -(rightIndex.y * 2) + 1;

        // Update raycaster
        raycaster.setFromCamera(new THREE.Vector2(clipX, clipY), camera);

        // Perform raycasting
        const intersects = raycaster.intersectObject(meshRef.current);

        if (intersects.length > 0 && intersects[0].uv) {
          const uv = intersects[0].uv;
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");

          if (context) {
            context.beginPath();
            context.arc(
              uv.x * canvas.width,
              (1 - uv.y) * canvas.height,
              4,
              0,
              2 * Math.PI
            );
            context.fillStyle = "black";
            context.fill();
            if (textureRef.current) {
              textureRef.current.needsUpdate = true;
            }
          }
        }
      }
    }

    // Find left hand for rotation
    const leftHand = handsWithHandedness.find(
      (hand) => hand.handedness === "Left"
    )?.landmarks;
    if (leftHand) {
      const leftPalm = leftHand[0]; // Palm center
      // Map x position to rotation
      const rotation = (1 - leftPalm.x - 0.5) * Math.PI * 2;
      setRotationY(rotation);
    }
  });

  // Get the first mesh from the loaded model
  const firstMesh = Object.values(nodes).find(
    (node): node is THREE.Mesh => node instanceof THREE.Mesh
  );
  if (!firstMesh) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={firstMesh.geometry}
      rotation={[0, rotationY, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial metalness={0} roughness={1} side={THREE.DoubleSide}>
        <canvasTexture
          ref={textureRef}
          attach="map"
          image={canvasRef.current}
        />
      </meshStandardMaterial>
    </mesh>
  );
}

function HandOverlay({
  handLandmarkArrayRef,
  handednessRef,
}: {
  handLandmarkArrayRef: RefLandmarks;
  handednessRef: RefHandedness;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to draw a single hand
  const drawHand = (
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    color: string
  ) => {
    // Draw joints
    landmarks.forEach((landmark) => {
      ctx.beginPath();
      ctx.arc(
        (1 - landmark.x) * ctx.canvas.width, // Flip X coordinate
        landmark.y * ctx.canvas.height,
        3,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = color;
      ctx.fill();
    });

    // Draw connections
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

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (handLandmarkArrayRef.current && handednessRef.current) {
        // Map hands to their handedness
        const handsWithHandedness = handLandmarkArrayRef.current.map(
          (landmarks, index) => ({
            landmarks,
            handedness: handednessRef.current![index],
          })
        );

        // Find hands by their actual handedness
        handsWithHandedness.forEach((hand) => {
          if (hand.handedness[0].categoryName === "Left") {
            drawHand(ctx, hand.landmarks, "rgba(0, 255, 0, 0.7)"); // Left hand in green
          } else if (hand.handedness[0].categoryName === "Right") {
            drawHand(ctx, hand.landmarks, "rgba(255, 0, 0, 0.7)"); // Right hand in red
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

export default function App() {
  const handLandmarkArrayRef = useRef<NormalizedLandmark[][] | null>(null);
  const handednessRef = useRef<Category[][] | null>(null);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <HandRecognitionVase
        handLandmarkArrayRef={handLandmarkArrayRef}
        handednessRef={handednessRef}
      />
      <HandOverlay
        handLandmarkArrayRef={handLandmarkArrayRef}
        handednessRef={handednessRef}
      />
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera
            makeDefault
            position={[0, 5, 5]}
            fov={60}
            rotation={[-Math.PI / 5, 0, 0]}
          />
          <Environment preset="sunset" />

          <ambientLight intensity={0.5} />
          <spotLight position={[0, 2, 10]} intensity={1} castShadow />
          <spotLight position={[-10, 2, -5]} intensity={1} castShadow />
          <spotLight position={[10, 2, -5]} intensity={1} castShadow />
          <PaintableVase
            handLandmarkArrayRef={handLandmarkArrayRef}
            handednessRef={handednessRef}
          />
          <AccumulativeShadows temporal frames={100} scale={40}>
            <RandomizedLight amount={8} position={[5, 5, -10]} />
          </AccumulativeShadows>
          <Sky
            distance={450000}
            sunPosition={[0, 1, 0]}
            inclination={0}
            azimuth={0.25}
          />

          {/* <OrbitControls
            minDistance={1.5}
            maxDistance={20}
            enableRotate={false} // Disable mouse rotation since we're using hand gestures
          /> */}
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload("/vase.glb");
