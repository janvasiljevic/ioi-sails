import { useFrame } from "@react-three/fiber";
import React, { MutableRefObject } from "react";
import { Mesh, PointLight, Vector3 } from "three";

type Props = {
  shipRef: MutableRefObject<Mesh | null>;
};

const offset = new Vector3(-10, 10, 10);

function FollowLight({ shipRef }: Props) {
  const lightRef = React.useRef<PointLight>(null!);

  useFrame(() => {
    if (!shipRef.current) return;

    lightRef.current.position.set(
      shipRef.current.position.x + offset.x,
      offset.y,
      shipRef.current.position.z + offset.z
    );
  });

  return (
    <pointLight
      ref={lightRef}
      castShadow
      intensity={4.5}
      color="orange"
      decay={0.8}
    >
      {/* <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh> */}
    </pointLight>
  );
}

export default FollowLight;
