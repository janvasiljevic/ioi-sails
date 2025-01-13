import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RefLandmarks } from "./types";
import {
  calculateIndexFingerOrientation,
  isIndexFingerPointing,
} from "./utilts";

type HandProps = {
  handLandmarkArrayRef: RefLandmarks;
  shipUpdateFn: (
    x: number | null,
    y: number | null,
    velocity: number | null
  ) => void;
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

const Hand3D = ({ handLandmarkArrayRef, shipUpdateFn }: HandProps) => {
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

    for (let i = 0; i < 21; i++) {
      const previousPosition = previousPositionsRef.current[i];
      const velocity = velocitiesRef.current[i];
      const sphere = sphereRefs.current[i];

      if (landmarks && landmarks[i]) {
        const landmark = landmarks[i];
        if (!landmark) continue;

        const targetPosition = new THREE.Vector3(
          (landmark.x - 0.5) * -40,
          10,
          (landmark.y - 0.5) * 40
        );

        velocity.copy(targetPosition).sub(previousPosition).multiplyScalar(0.1);

        sphere.position.lerp(targetPosition, 0.1);

        previousPosition.copy(sphere.position);
      } else {
        sphere.position.add(velocity);
      }
    }

    for (let i = 0; i < connections.length; i++) {
      const [start, end] = connections[i];
      const startPos = sphereRefs.current[start].position;
      const endPos = sphereRefs.current[end].position;

      const line = lineRefs.current[i];
      const geometry = line.geometry;
      const positions = geometry.attributes.position.array;

      positions[0] = startPos.x;
      positions[1] = startPos.y;
      positions[2] = startPos.z;

      positions[3] = endPos.x;
      positions[4] = endPos.y;
      positions[5] = endPos.z;

      geometry.attributes.position.needsUpdate = true;
    }

    if (landmarks) {
      const orientation = calculateIndexFingerOrientation(landmarks);
      setIndexFingerOrientation(orientation);

      const isPointing = isIndexFingerPointing(landmarks);
      setIsPointing(isPointing);

      if (isPointing) {
        shipUpdateFn(orientation.x, orientation.y, 2);
      } else {
        shipUpdateFn(null, null, null);
      }
    } else {
      shipUpdateFn(null, null, null);
    }
  });
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

export default Hand3D;
