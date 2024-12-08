import { Landmark, NormalizedLandmark } from "@mediapipe/tasks-vision";

import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import {
  Dispatch,
  SetStateAction,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { Perf } from "r3f-perf";

import * as THREE from "three";

import { OrbitControls } from "@react-three/drei";

extend({ OutlineEffect });

extend({ OrbitControls });

import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { BlurPass, Resizer, KernelSize, Resolution } from "postprocessing";

import { useLoader } from "@react-three/fiber";

import { OutlineEffect } from "three/examples/jsm/Addons.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { DissolveMaterial } from "./DissolveShader";
import Hand from "./Hand";

import "./main.css";
import { Leva, useControls } from "leva";

type VertexData = {
  initH: number;
  amplitude: number;
  phase: number;
};

type IPlaneProps = {
  vertData: VertexData[];
  setVertData: Dispatch<SetStateAction<VertexData[]>>;
  waterColor: string;
};

function WaterPlane({ vertData, setVertData, waterColor }: IPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null!);

  const { clock } = useThree();

  useEffect(() => {
    if (!meshRef.current) return;

    const g = new THREE.PlaneGeometry(50, 50, 50, 50);
    g.rotateX(-Math.PI * 0.5);
    const vertData = [];
    const v3 = new THREE.Vector3();
    for (let i = 0; i < g.attributes.position.count; i++) {
      v3.fromBufferAttribute(g.attributes.position, i);
      vertData.push({
        initH: v3.y,
        amplitude: THREE.MathUtils.randFloatSpread(2 / 4),
        phase: THREE.MathUtils.randFloat(0, Math.PI),
      });
    }
    meshRef.current.geometry = g;
    setVertData(vertData);
  }, [setVertData]);

  useFrame(() => {
    const time = clock.getElapsedTime();

    if (meshRef.current) {
      vertData.forEach((vd, idx) => {
        const y = vd.initH + Math.sin(time + vd.phase) * vd.amplitude;
        meshRef.current.geometry.attributes.position.setY(idx, y);
      });
      meshRef.current.geometry.attributes.position.needsUpdate = true;
      meshRef.current.geometry.computeVertexNormals();
    }
  });

  return (
    <mesh ref={meshRef} receiveShadow>
      <planeGeometry attach="geometry" args={[50, 50, 15, 15]} />
      <DissolveMaterial
        baseMaterial={new THREE.MeshStandardMaterial({ color: waterColor })}
        mode="translate"
        thickness={0.1}
        feather={5}
        color={waterColor}
        intensity={0}
        debug={false}
      />
      {/* <meshLambertMaterial attach="material" color="aqua" /> */}
    </mesh>
  );
}

function Ship() {
  const gltf = useLoader(OBJLoader, "/ship.obj");

  const { shipColor } = useControls({
    shipColor: "#eeb288",
  });

  return (
    <mesh scale={0.09} castShadow geometry={gltf.children[0].geometry}>
      {/* <Edges color={"black"} threshold={25} /> */}
      {/* <Outlines thickness={1} visible={true} /> */}

      <meshStandardMaterial color={shipColor} side={THREE.DoubleSide} />
    </mesh>
  );
}

type IFloatingBoxProps = {
  vertData: VertexData[];
  shipOrientation: THREE.Euler;
};

function FloatingShip({ vertData, shipOrientation }: IFloatingBoxProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { clock } = useThree();

  useFrame(() => {
    const time = clock.getElapsedTime();
    if (vertData.length > 0 && meshRef.current) {
      // Find the 4 vertices around the (0, 0) position
      const vertices = [
        { x: 0, z: 0, height: 0, index: 0 },
        { x: 0, z: 1, height: 0, index: 1 },
        { x: 1, z: 0, height: 0, index: 16 },
        { x: 1, z: 1, height: 0, index: 17 },
      ];

      vertices.forEach((vertex) => {
        const vd = vertData[vertex.index];
        vertex.height = vd.initH + Math.sin(time + vd.phase) * vd.amplitude;
      });

      // Interpolate the height
      const height =
        (vertices[0].height +
          vertices[1].height +
          vertices[2].height +
          vertices[3].height) /
        4;

      // Calculate normal using the cross product of two vectors on the plane
      const v1 = new THREE.Vector3(
        1,
        vertices[2].height - vertices[0].height,
        0
      ).normalize();
      const v2 = new THREE.Vector3(
        0,
        vertices[1].height - vertices[0].height,
        1
      ).normalize();
      const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();

      meshRef.current.position.y = height;
      meshRef.current.rotation.x = -Math.asin(normal.z / 2);
      meshRef.current.rotation.z = -Math.asin(normal.x / 2);
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]} receiveShadow>
      {/* <boxGeometry attach="geometry" args={[1, 1, 1]} /> */}
      <group rotation={shipOrientation}>
        <Ship />
      </group>
    </mesh>
  );
}

type HandProps = {
  handLandmarkArrayRef: React.MutableRefObject<NormalizedLandmark[][] | null>;
  changeShipOrientation: (x: number, y: number) => void;
};

const connections = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // Thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // Index finger
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12], // Middle finger
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16], // Ring finger
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20], // Pinky
  [0, 17], // Palm base
];

const calculateIndexFingerOrientation = (
  landmarks: Landmark[]
): { x: number; y: number } => {
  const baseIndex = 5;
  const tipIndex = 8;

  const base = new THREE.Vector3(
    landmarks[baseIndex].x,
    landmarks[baseIndex].y,
    0
  );
  const tip = new THREE.Vector3(
    landmarks[tipIndex].x,
    landmarks[tipIndex].y,
    0
  );

  const direction = new THREE.Vector3().subVectors(tip, base).normalize();

  return { x: direction.x, y: direction.y };
};

const calculateVector = (start: THREE.Vector3, end: THREE.Vector3) => {
  return new THREE.Vector3().subVectors(end, start).normalize();
};

const calculateAngle = (v1: THREE.Vector3, v2: THREE.Vector3) => {
  return v1.angleTo(v2);
};

const isIndexFingerPointing = (landmarks: Landmark[]): boolean => {
  const indices = [5, 6, 7, 8];

  const vectors = indices.slice(1).map((idx, i) => {
    const start = new THREE.Vector3(
      landmarks[indices[i]].x,
      landmarks[indices[i]].y,
      0
    );
    const end = new THREE.Vector3(landmarks[idx].x, landmarks[idx].y, 0);
    return calculateVector(start, end);
  });

  const angles = vectors.slice(1).map((v, i) => calculateAngle(vectors[i], v));
  const angleThreshold = Math.PI / 8; // Adjust the threshold as needed

  return angles.every((angle) => angle < angleThreshold);
};

const Hand3D = ({ handLandmarkArrayRef, changeShipOrientation }: HandProps) => {
  const sphereRefs = useRef<THREE.Mesh[]>([]);
  const previousPositionsRef = useRef<THREE.Vector3[]>([]);
  const velocitiesRef = useRef<THREE.Vector3[]>([]);
  const [size, setSize] = useState(0);
  const lineRefs = useRef<THREE.Line[]>([]);
  const [indexFingerOrientation, setIndexFingerOrientation] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [isPointing, setIsPointing] = useState<boolean>(false);

  useEffect(() => {
    // Initialize previous positions and velocities with zero vectors
    previousPositionsRef.current = Array.from(
      { length: 21 },
      () => new THREE.Vector3(0, 0, 0)
    );
    velocitiesRef.current = Array.from(
      { length: 21 },
      () => new THREE.Vector3(0, 0, 0)
    );
  }, []);

  useFrame(() => {
    if (!handLandmarkArrayRef.current) return;

    if (handLandmarkArrayRef.current.length === 0) {
      setSize((prev) => Math.max(prev - 0.01, 0));
    } else {
      setSize(0.1);
    }

    const landmarks = handLandmarkArrayRef.current[0];

    sphereRefs.current.forEach((sphere, index) => {
      const previousPosition = previousPositionsRef.current[index];
      const velocity = velocitiesRef.current[index];

      if (landmarks && landmarks[index]) {
        const landmark = landmarks[index];
        const targetPosition = new THREE.Vector3(
          (landmark.x - 0.5) * -40,
          3,
          (landmark.y - 0.5) * 40
        );

        // Calculate new velocity
        velocity.copy(targetPosition).sub(previousPosition).multiplyScalar(0.1); // Adjust factor for smoother velocity

        // Lerp the current position to the target position
        sphere.position.lerp(targetPosition, 0.1); // Adjust the factor (0.1) for smoothing

        // Update the previous position
        previousPosition.copy(sphere.position);
      } else {
        // Apply the velocity to continue moving in the last known direction
        sphere.position.add(velocity);
      }
    });

    connections.forEach(([start, end], index) => {
      const startPos = sphereRefs.current[start].position;
      const endPos = sphereRefs.current[end].position;

      const line = lineRefs.current[index];
      const geometry = line.geometry;
      const positions = geometry.attributes.position.array;

      positions[0] = startPos.x;
      positions[1] = startPos.y;
      positions[2] = startPos.z;

      positions[3] = endPos.x;
      positions[4] = endPos.y;
      positions[5] = endPos.z;

      geometry.attributes.position.needsUpdate = true;
    });

    if (landmarks) {
      const orientation = calculateIndexFingerOrientation(landmarks);
      setIndexFingerOrientation(orientation);

      const isPointing = isIndexFingerPointing(landmarks);
      setIsPointing(isPointing);

      if (isPointing) changeShipOrientation(orientation.x, orientation.y);
    }
  });

  console.log("isPointing", isPointing);
  console.log("indexFingerOrientation", indexFingerOrientation);

  return (
    // rotate for 30 degrees
    <group rotation={[0, Math.PI / 4, 0]}>
      {Array.from({ length: 21 }).map((_, index) => (
        <mesh
          key={index}
          ref={(el) => {
            if (el) sphereRefs.current[index] = el;
          }}
          position={[0, 0, 0]}
        >
          <sphereGeometry attach="geometry" args={[size, 4, 4]} />
          <meshStandardMaterial
            color="yellow"
            emissive={"yellow"}
            emissiveIntensity={3}
          />
        </mesh>
      ))}
      {connections.map((_, index) => (
        <line
          key={index}
          ref={(el) => {
            if (el) lineRefs.current[index] = el as unknown as THREE.Line;
          }}
        >
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array(6)}
              itemSize={3}
              count={2}
            />
          </bufferGeometry>
          <lineBasicMaterial attach="material" color="white" />
        </line>
      ))}

      {isPointing && (
        <arrowHelper
          args={[
            new THREE.Vector3(
              -indexFingerOrientation.x,
              0,
              indexFingerOrientation.y
            ),
            new THREE.Vector3(0, 1, 0),
            5,
            0xffff00,
          ]}
        />
      )}
    </group>
  );
};

function App() {
  const [vertData, setVertData] = useState<VertexData[]>([]);

  const { showVideo, showCanvas, showPerf, waterColor } = useControls({
    showVideo: false,
    showCanvas: false,
    showPerf: false,
    waterColor: "#bab2ae",
  });

  const handLandmarkArrayRef = useRef<NormalizedLandmark[][] | null>([]);

  const [shipOrientation, setShipOrientation] = useState<THREE.Euler>(
    new THREE.Euler(0, 0, 0)
  );

  // const [targetShipOrientation, setTargetShipOrientation] = useState<THREE.Euler>(new THREE.Euler(0, 0, 0));

  const changeShipOrientation = (x: number, y: number) => {
    const targetAngle = Math.atan2(y, x) + Math.PI + Math.PI / 4;

    setShipOrientation(new THREE.Euler(0, targetAngle, 0));
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <Leva flat neverHide />
      <div style={{ position: "absolute", top: 0, left: 0, zIndex: 1000 }}>
        <Hand
          handLandmarkArrayRef={handLandmarkArrayRef}
          showCanvas={showCanvas}
          showVideo={showVideo}
        />
      </div>
      <Canvas
        orthographic
        camera={{ zoom: 30, position: [100, 100, 100] }}
        shadows
      >
        <Suspense fallback={<>Loading</>}>
          {/* fog je nice, sam sele ko mas staticno kamero */}
          <fog attach="fog" args={["black", 180, 200]} />

          {/* <OrbitControls /> */}

          <Hand3D
            handLandmarkArrayRef={handLandmarkArrayRef}
            changeShipOrientation={changeShipOrientation}
          />

          <hemisphereLight intensity={Math.PI / 5} />
          <directionalLight
            position={[0, 1, 2]}
            intensity={0.7}
            color="white"
            castShadow
          />

          <WaterPlane
            vertData={vertData}
            setVertData={setVertData}
            waterColor={waterColor}
          />
          <FloatingShip vertData={vertData} shipOrientation={shipOrientation} />
          {/* <Grid infiniteGrid /> */}

          {showPerf && <Perf position="bottom-right" />}

          <Suspense fallback={null}>
            <EffectComposer>
              <Bloom luminanceThreshold={0.9} />
            </EffectComposer>
          </Suspense>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
