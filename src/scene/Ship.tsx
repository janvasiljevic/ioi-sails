import { useFrame } from "@react-three/fiber";
import { MutableRefObject, useRef } from "react";
import ShipModel from "./models/ShipModel";
import * as THREE from "three";
import {
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { useGameStore } from "../store";

function calculateWaveHeight(time: number, x: number, z: number) {
  time -= 0.1;
  const baseAmplitude = 0.5;
  const phase = x * 0.1 + z * 0.1;
  const wave1 = Math.sin(time * 1.5 + phase) * baseAmplitude;
  const wave2 = Math.sin(time * 2.3 + phase * 1.5) * baseAmplitude * 0.5;
  return wave1 + wave2;
}

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

  const { setGameState } = useGameStore();

  const updateOrientation = () => {
    if (angleRad.current !== null) {
      rotationEuler.current.set(0, angleRad.current, 0);
      targetQuaternion.current.setFromEuler(rotationEuler.current);

      currentQuaternion.current.copy(shipRef.current.quaternion);

      currentQuaternion.current.slerp(targetQuaternion.current, 0.01);
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

    if (rigidBodyRef.current)
      rigidBodyRef.current.setNextKinematicRotation({
        x: shipRef.current.quaternion.x,
        y: shipRef.current.quaternion.y,
        z: shipRef.current.quaternion.z,
        w: shipRef.current.quaternion.w,
      });
  };

  const updatePosition = (delta: number, time: number) => {
    shipVelocity.current = shipVelocity.current * 0.99;

    const x = Math.sin(lastAngleRad.current) * shipVelocity.current * delta;
    const z = Math.cos(lastAngleRad.current) * shipVelocity.current * delta;

    shipRef.current.position.x += x;
    shipRef.current.position.z += z;

    shipRef.current.position.y = calculateWaveHeight(
      time,
      shipRef.current.position.x,
      shipRef.current.position.z
    );

    if (rigidBodyRef.current)
      rigidBodyRef.current.setNextKinematicTranslation({
        x: shipRef.current.position.x,
        y: shipRef.current.position.y,
        z: shipRef.current.position.z,
      });
  };

  const rigidBodyRef = useRef<RapierRigidBody>(null);

  useFrame(({ clock }, delta) => {
    updateOrientation();
    updatePosition(delta, clock.getElapsedTime());
  });

  return (
    <>
      <mesh ref={shipRef} position={[0, 0.5, 0]} castShadow receiveShadow>
        <ShipModel />
      </mesh>

      <RigidBody ref={rigidBodyRef} type="kinematicPosition">
        <CuboidCollider
          args={[0.6, 0.2, 1.5]}
          sensor
          onIntersectionEnter={({ other }) => {
            const data: {
              [key: string]: string;
            } = other.rigidBody?.userData as {
              [key: string]: string;
            };

            if (data.type === "land") setGameState("gameOver");
            else if (data.type === "reward") setGameState("gameWon");
            else throw new Error("Unknown collision type");
          }}
        />
      </RigidBody>
    </>
  );
};

export default Ship;
