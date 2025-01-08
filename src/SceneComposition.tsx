import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useControls } from "leva";
import { Perf } from "r3f-perf";
import React, { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import Hand3D from "./Hand3D";
import Ship from "./scene/Ship";
import WaterPlane from "./scene/WaterPlane";
import { RefLandmarks, VertexData } from "./types";

type Props = {
  landmarksRef: RefLandmarks;
};

const SceneComposition = ({ landmarksRef }: Props) => {
  const [waterVertexes, setWaterVertexes] = useState<VertexData[]>([]);
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
    if (x === null || y === null || velocity === null) {
      shipOrientationRef.current = null;
      shipVelocityRef.current = 0;
      return;
    }

    const targetAngle = Math.atan2(y, x) + (3 * Math.PI) / 2 + Math.PI / 4;

    shipVelocityRef.current = velocity;
    shipOrientationRef.current = targetAngle;
  };

  return (
    <>
      <color attach="background" args={[bgColor]} />
      {/* fog je nice, sam sele ko mas staticno kamero */}
      <fog attach="fog" args={["black", 160, 200]} />

      <FollowShip shipRef={shipRef}>
        <Hand3D handLandmarkArrayRef={landmarksRef} shipUpdateFn={shipUpdate} />
        <directionalLight
          position={[0, 1, 2]}
          intensity={0.9}
          color="white"
          castShadow
          ref={directionalLightRef}
        />
        <hemisphereLight intensity={Math.PI / 8} />
      </FollowShip>

      <WaterPlane
        vertData={waterVertexes}
        setVertData={setWaterVertexes}
        shipRef={shipRef}
      />
      <Ship
        waterVertexData={waterVertexes}
        angleRad={shipOrientationRef}
        shipVelocity={shipVelocityRef}
        shipRef={shipRef}
      />

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
