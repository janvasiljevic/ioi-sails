import { useFrame } from "@react-three/fiber";
import React, { MutableRefObject } from "react";
import { DirectionalLight, Mesh, Vector3 } from "three";

type Props = {
  shipRef: MutableRefObject<Mesh | null>;
};

const offset = new Vector3(12, 1, 10);

const distance = 20;

function FollowLight({ shipRef }: Props) {
  const lightRef = React.useRef<DirectionalLight>(null!);

  useFrame(() => {
    if (!shipRef.current) return;

    lightRef.current.position.set(
      shipRef.current.position.x + offset.x,
      shipRef.current.position.y + offset.y,
      shipRef.current.position.z + offset.z
    );
  });

  return (
    <directionalLight ref={lightRef} castShadow>
      <orthographicCamera
        attach="shadow-camera"
        args={[-distance, distance, distance, -distance]}
      />
    </directionalLight>
  );
}

export default FollowLight;
