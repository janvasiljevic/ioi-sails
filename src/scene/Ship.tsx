import { useFrame } from "@react-three/fiber";
import { MutableRefObject, useRef } from "react";
import ShipModel from "./models/ShipModel";

import * as THREE from "three";

type Props = {
  angleRad: MutableRefObject<number | null>;
  shipVelocity: MutableRefObject<number>;
  shipRef: MutableRefObject<THREE.Mesh>;
};

const Ship = ({ angleRad, shipVelocity, shipRef }: Props) => {
  const targetQuaternion = useRef(new THREE.Quaternion()); // Store target quaternion
  const currentQuaternion = useRef(new THREE.Quaternion()); // Store current quaternion
  const lastAngleRad = useRef<number>(angleRad.current ?? 0);
  const angularVelocity = useRef(1);
  const rotationEuler = useRef(new THREE.Euler(0, 0, 0));

  const updateOrientation = () => {
    if (angleRad.current !== null) {
      rotationEuler.current.set(0, angleRad.current, 0);
      targetQuaternion.current.setFromEuler(rotationEuler.current);

      currentQuaternion.current.copy(shipRef.current.quaternion);

      currentQuaternion.current.slerp(targetQuaternion.current, 0.05);
      shipRef.current.quaternion.copy(currentQuaternion.current);

      angularVelocity.current = 1;
      lastAngleRad.current = angleRad.current || 0;
    } else {
      angularVelocity.current *= 0.99;

      shipRef.current.quaternion.slerp(
        targetQuaternion.current,
        0.05 * angularVelocity.current
      );
    }
  };

  const updatePosition = (delta: number) => {
    shipVelocity.current = shipVelocity.current * 0.99;

    const x = Math.sin(lastAngleRad.current) * shipVelocity.current * delta;
    const z = Math.cos(lastAngleRad.current) * shipVelocity.current * delta;

    shipRef.current.position.x += x;
    shipRef.current.position.z += z;
  };

  useFrame((_, delta) => {
    updateOrientation();
    updatePosition(delta);
  });

  return (
    <mesh ref={shipRef} position={[0, 0.5, 0]} castShadow receiveShadow>
      <ShipModel />
    </mesh>
  );
};

export default Ship;
