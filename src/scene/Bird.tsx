import { useFrame } from "@react-three/fiber";
import { MutableRefObject, useRef } from "react";
import * as THREE from "three";
import { Vector3 } from "three";
import BirdModel from "./models/BirdModel";

type Props = {
  shipRef: MutableRefObject<THREE.Mesh | null>;
  baseRadius?: number;
  heightVariation?: number;
  horizontalVariation?: number;
  speed?: number;
  initialPhase?: number;
};

function Bird({
  shipRef,
  baseRadius = 10,
  heightVariation = 1,
  horizontalVariation = 3,
  speed = 1,
  initialPhase = 0,
}: Props) {
  const birdRef = useRef<THREE.Mesh>(null!);
  const timeRef = useRef(initialPhase); // Start with initial phase

  const lookedPosition = new Vector3();

  useFrame((_, delta) => {
    if (!shipRef.current) return;
    if (!birdRef.current) return;

    lookedPosition.lerp(shipRef.current.position, 0.1);

    timeRef.current += delta * speed;

    const angle = timeRef.current;
    const baseX = Math.cos(angle) * baseRadius;
    const baseZ = Math.sin(angle) * baseRadius;

    const verticalOffset = Math.sin(angle * 2) * heightVariation;

    const horizontalVariationX = Math.sin(angle * 0.5) * horizontalVariation;
    const horizontalVariationZ = Math.cos(angle * 0.7) * horizontalVariation;

    birdRef.current.position.set(
      lookedPosition.x + baseX + horizontalVariationX,
      lookedPosition.y + 7 + verticalOffset,
      lookedPosition.z + baseZ + horizontalVariationZ
    );

    const tangentX = -Math.sin(angle) * baseRadius;
    const tangentZ = Math.cos(angle) * baseRadius;

    const targetPosition = new Vector3(
      birdRef.current.position.x + tangentX,
      birdRef.current.position.y,
      birdRef.current.position.z + tangentZ
    );

    birdRef.current.lookAt(targetPosition);
  });

  return (
    <group>
      <mesh ref={birdRef}>
        <BirdModel />
        {/* <mesh position={birdRef.current?.position || [0, 0, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="red" wireframe />
        </mesh> */}
      </mesh>
    </group>
  );
}

export default Bird;
