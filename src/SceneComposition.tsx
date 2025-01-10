import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useControls } from "leva";
import { Perf } from "r3f-perf";
import React, { Suspense, useRef } from "react";
import * as THREE from "three";
import Hand3D from "./Hand3D";
import { DissolveMaterial } from "./materials/DissolveMaterial";
import Bird from "./scene/Bird";
import Ship from "./scene/Ship";
import { RefLandmarks } from "./types";

type Props = {
  landmarksRef: RefLandmarks;
};

const SceneComposition = ({ landmarksRef }: Props) => {
  const shipOrientationRef = useRef<number | null>(null);
  const shipVelocityRef = useRef<number>(0);
  const shipRef = useRef<THREE.Mesh>(null!);

  const { showPerf, bgColor } = useControls({
    showPerf: false,
    bgColor: "#241f2b",
  });

  const directionalLightRef = useRef<THREE.DirectionalLight>(null!);

  const shipUpdate = (
    x: number | null,
    y: number | null,
    velocity: number | null
  ) => {
    if (!x || !y || !velocity) {
      shipOrientationRef.current = null;
      return;
    }

    const targetAngle = Math.atan2(y, x) + (3 * Math.PI) / 2 + Math.PI / 4;

    shipVelocityRef.current = velocity;
    shipOrientationRef.current = targetAngle;
  };

  const { waterColor } = useControls({
    waterColor: "#9badb7",
  });

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={["black", 80, 120]} />

      {/* <OrbitControls /> */}

      <FollowShip shipRef={shipRef}>
        <Hand3D handLandmarkArrayRef={landmarksRef} shipUpdateFn={shipUpdate} />
        <directionalLight
          position={[12, 1, 10]}
          intensity={0.9}
          castShadow
          ref={directionalLightRef}
        />
        <hemisphereLight intensity={Math.PI / 8} />
      </FollowShip>

      <DissolveMaterial
        baseMaterial={new THREE.MeshStandardMaterial({ color: waterColor })}
        mode="translate"
        thickness={0.1}
        feather={5}
        color={waterColor}
        intensity={0}
        shipRef={shipRef}
      />

      <Ship
        angleRad={shipOrientationRef}
        shipVelocity={shipVelocityRef}
        shipRef={shipRef}
      />

      <Bird shipRef={shipRef} baseRadius={2} initialPhase={100} />
      <Bird shipRef={shipRef} baseRadius={1} initialPhase={0} />

      {showPerf && <Perf position="bottom-right" />}

      <Suspense fallback={null}>
        <EffectComposer>
          <Bloom luminanceThreshold={0.9} />
        </EffectComposer>
      </Suspense>
    </>
  );
};

type FollowShipProps = {
  shipRef: React.MutableRefObject<THREE.Mesh>;
  children: React.ReactNode;
};

const FollowShip = ({ shipRef, children }: FollowShipProps) => {
  const groupRef = useRef<THREE.Group>(null!);

  const { camera } = useThree();

  useFrame(() => {
    if (groupRef.current && shipRef.current) {
      groupRef.current.position.copy(shipRef.current.position);

      camera.position.x = shipRef.current.position.x + 50;
      camera.position.z = shipRef.current.position.z + 50;
      camera.position.y = shipRef.current.position.y + 50;
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

export default SceneComposition;
