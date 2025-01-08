import { useThree, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import ShipModel from "./ShipModel";

import * as THREE from "three";
import { VertexData } from "../types";

type Props = {
  waterVertexData: VertexData[];
  angleRad: React.MutableRefObject<number | null>;
  shipVelocity: React.MutableRefObject<number>;
  shipRef: React.MutableRefObject<THREE.Mesh>;
};

const Ship = ({ waterVertexData, angleRad, shipVelocity, shipRef }: Props) => {
  const { clock } = useThree();

  const targetQuaternion = useRef(new THREE.Quaternion()); // Store target quaternion
  const currentQuaternion = useRef(new THREE.Quaternion()); // Store current quaternion
  const lastAngleRad = useRef<number>(angleRad.current ?? 0);
  const angularVelocity = useRef(1);
  const rotationEuler = useRef(new THREE.Euler(0, 0, 0));
  const currentVelocity = useRef(0);

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

  const updatePosition = () => {
    if (shipVelocity.current === 0) {
      currentVelocity.current *= 0.99;
    } else {
      currentVelocity.current = shipVelocity.current;
    }

    const delta = clock.getDelta() * 2;

    const x = Math.sin(lastAngleRad.current) * currentVelocity.current * delta;
    const z = Math.cos(lastAngleRad.current) * currentVelocity.current * delta;

    shipRef.current.position.x += x;
    shipRef.current.position.z += z;
  };

  useFrame(() => {
    updateOrientation();
    updatePosition();

    const time = clock.getElapsedTime();
    if (waterVertexData.length > 0 && shipRef.current) {
      // Find the 4 vertices around the (0, 0) position
      const vertices = [
        { x: 0, z: 0, height: 0, index: 0 },
        { x: 0, z: 1, height: 0, index: 1 },
        { x: 1, z: 0, height: 0, index: 16 },
        { x: 1, z: 1, height: 0, index: 17 },
      ];

      vertices.forEach((vertex) => {
        const vd = waterVertexData[vertex.index];
        vertex.height = vd.initH + Math.sin(time + vd.phase) * vd.amplitude;
      });

      // Interpolate the height
      const height =
        (vertices[0].height +
          vertices[1].height +
          vertices[2].height +
          vertices[3].height) /
        4;

      shipRef.current.position.y = height;
    }
  });

  return (
    <mesh ref={shipRef} position={[0, 0.5, 0]} castShadow receiveShadow>
      <ShipModel />
    </mesh>
  );
};

export default Ship;
