import { Category, NormalizedLandmark } from "@mediapipe/tasks-vision";
import {
  AccumulativeShadows,
  Environment,
  PerspectiveCamera,
  RandomizedLight,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  MutableRefObject,
  Suspense,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { HandOverlay } from "../components/HandOverlay/HandOverlay";
import HandRecognition from "../recognition/HandRecognition";
import { usePaintingStore } from "../store";
import { isHandOpen, isIndexFingerPointing } from "../utilts";
import { supabase } from "../supa-client";
import EditorOverlay from "../components/EditorOverlay/EditorOverlay";
import styles from "./../components/common/common.module.css";
import { Leva } from "leva";

type Props = {
  handLandmarkArrayRef: MutableRefObject<NormalizedLandmark[][] | null>;
  handednessRef: MutableRefObject<Category[][] | null>;
  canvasRef: MutableRefObject<HTMLCanvasElement>;
};

function PaintableVase({
  handLandmarkArrayRef,
  handednessRef,
  canvasRef,
}: Props) {
  const { nodes } = useGLTF("/vase.glb");
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [rotationY, setRotationY] = useState(0);
  const { camera } = useThree();
  const raycaster = new THREE.Raycaster();
  const lastLeftHandXRef = useRef<number | null>(null);

  const { currentColor, setCurrentColor } = usePaintingStore();

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
  }, [canvasRef]);

  const drawBrushStroke = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    pressure: number,
    lastX?: number,
    lastY?: number
  ) => {
    if (!lastX || !lastY) return;

    // Fixes uv seam issue
    const uvDistance = Math.hypot(x - lastX, y - lastY);

    const maxUVDistance = context.canvas.width * 0.1;
    if (uvDistance > maxUVDistance) {
      return;
    }

    context.strokeStyle = currentColor;
    context.lineWidth = Math.max(1, pressure * 15);
    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();
    context.moveTo(lastX, lastY);
    context.lineTo(x, y);
    context.stroke();

    context.beginPath();
    context.fillStyle = currentColor;
    context.arc(x, y, context.lineWidth / 2, 0, Math.PI * 2);
    context.fill();
  };

  useFrame(() => {
    if (
      !handLandmarkArrayRef.current ||
      !handednessRef.current ||
      !meshRef.current
    )
      return;

    const handsWithHandedness = handLandmarkArrayRef.current.map(
      (landmarks, index) => ({
        landmarks,
        handedness: handednessRef.current![index][0].categoryName,
      })
    );

    const rightHand = handsWithHandedness.find(
      (hand) => hand.handedness === "Right"
    )?.landmarks;

    if (rightHand) {
      if (!isHandOpen(rightHand)) {
        const normalizedY = Math.max(0, Math.min(1, rightHand[0].y));
        const hue = normalizedY * 360;
        setCurrentColor(`hsl(${hue}, 100%, 50%)`);
        lastPointRef.current = null;
      } else if (isIndexFingerPointing(rightHand)) {
        const indexTip = rightHand[8];
        const indexDip = rightHand[7];

        if (indexTip && indexDip) {
          const pressure = Math.min(
            1,
            Math.max(
              0.1,
              1 -
                Math.hypot(indexTip.x - indexDip.x, indexTip.y - indexDip.y) * 5
            )
          );

          const clipX = (1 - indexTip.x) * 2 - 1;
          const clipY = -(indexTip.y * 2) + 1;

          raycaster.setFromCamera(new THREE.Vector2(clipX, clipY), camera);
          const intersects = raycaster.intersectObject(meshRef.current);

          if (intersects.length > 0 && intersects[0].uv) {
            const uv = intersects[0].uv;
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");

            if (context) {
              const currentX = uv.x * canvas.width;
              const currentY = (1 - uv.y) * canvas.height;

              context.strokeStyle = currentColor;

              if (lastPointRef.current) {
                drawBrushStroke(
                  context,
                  currentX,
                  currentY,
                  pressure,
                  lastPointRef.current.x,
                  lastPointRef.current.y
                );
              }

              lastPointRef.current = { x: currentX, y: currentY };

              if (textureRef.current) {
                textureRef.current.needsUpdate = true;
              }
            }
          } else {
            lastPointRef.current = null;
          }
        }
      }
    } else {
      lastPointRef.current = null;
    }

    const leftHand = handsWithHandedness.find(
      (hand) => hand.handedness === "Left"
    )?.landmarks;

    if (leftHand && isHandOpen(leftHand)) {
      const leftPalm = leftHand[0];

      if (lastLeftHandXRef.current !== null) {
        const deltaX = leftPalm.x - lastLeftHandXRef.current;
        const rotationDelta = -deltaX * Math.PI * 2;
        setRotationY((prev) => prev + rotationDelta);
      }

      lastLeftHandXRef.current = leftPalm.x;
    } else {
      lastLeftHandXRef.current = null;
    }
  });

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

export default function PaintableVaseScene() {
  const handLandmarkArrayRef = useRef<NormalizedLandmark[][] | null>(null);
  const handednessRef = useRef<Category[][] | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const [submitted, setSubmitted] = useState(false);

  const submit = async (createdBy: string) => {
    if (submitted) return;

    const t = await supabase.from("textures").insert([
      {
        created_by: createdBy,
        texture: canvasRef.current.toDataURL("image/png"),
      },
    ]);

    if (t.status === 201) {
      setSubmitted(true);
      console.log("Texture saved");
    } else {
      alert("Failed to save texture");
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "goldenrod" }}>
      <HandRecognition
        handLandmarkArrayRef={handLandmarkArrayRef}
        handednessRef={handednessRef}
        numberOfHands={2}
      />
      <HandOverlay
        handLandmarkArrayRef={handLandmarkArrayRef}
        handednessRef={handednessRef}
      />
      {submitted && (
        <div className={styles.container} style={{ opacity: 1, zIndex: 2 }}>
          <p className={styles.message}>Thanks for submitting your artifact.</p>
          <p className={styles.submessage}>
            Another adventurer will find it soon.
          </p>
        </div>
      )}

      <Leva hidden />

      <EditorOverlay create={submit} />
      <Canvas shadows>
        <Suspense fallback={null}>
          <group>
            <PerspectiveCamera
              makeDefault
              position={[0, 5, 5]}
              fov={60}
              rotation={[-Math.PI / 5, 0, 0]}
            />
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <spotLight position={[0, 2, 10]} intensity={1} castShadow />
            <spotLight position={[-10, 2, -5]} intensity={1} castShadow />
            <spotLight position={[10, 2, -5]} intensity={1} castShadow />
            <PaintableVase
              handLandmarkArrayRef={handLandmarkArrayRef}
              handednessRef={handednessRef}
              canvasRef={canvasRef}
            />
            <AccumulativeShadows
              temporal
              frames={100}
              scale={40}
              color="orange"
            >
              <RandomizedLight amount={8} position={[5, 5, -10]} />
            </AccumulativeShadows>
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/vase.glb");
