import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Physics, RigidBody } from "@react-three/rapier";
import { useControls } from "leva";
import { Perf } from "r3f-perf";
import React, { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import Hand3D from "./Hand3D";
import { DissolveMaterial } from "./materials/DissolveMaterial";
import Bird from "./scene/Bird";
import FollowLight from "./scene/FollowLight";
import AnimatedVase from "./scene/models/AnimatedVase";
import Ship from "./scene/Ship";
import { useDistanceStore, useGameStore } from "./store";
import { RefLandmarks } from "./types";
import ClippingPlaneHelpers from "./scene/ClippingPlanesHelper";

type Props = {
  landmarksRef: RefLandmarks;
};

const SceneComposition = ({ landmarksRef }: Props) => {
  const shipOrientationRef = useRef<number | null>(null);
  const shipVelocityRef = useRef<number>(0);
  const shipRef = useRef<THREE.Mesh>(null!);

  const { gameState } = useGameStore();
  const { position } = useDistanceStore();

  const {
    showPerf,
    bgColor,
    useOrbitControls,
    showDebugPhysics,
    shipSpeed,
    showPlanes,
  } = useControls({
    showPlanes: false,
    showPerf: false,
    bgColor: "#241f2b",
    useOrbitControls: false,
    showDebugPhysics: false,
    shipSpeed: {
      value: 1,
      min: 0.5,
      max: 5,
    },
  });

  const shipUpdate = (
    x: number | null,
    y: number | null,
    velocity: number | null
  ) => {
    if (gameState !== "normal") return;

    if (!x || !y || !velocity) {
      shipOrientationRef.current = null;
      return;
    }

    const targetAngle = Math.atan2(y, x) + (3 * Math.PI) / 2 + Math.PI / 4;

    shipVelocityRef.current = velocity * shipSpeed;
    shipOrientationRef.current = targetAngle;
  };

  const { waterColor } = useControls({
    waterColor: "#9badb7",
  });

  const radius = 13;
  const segments = 16;

  const planes = useMemo(() => {
    const planeArray = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const normal = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      planeArray.push(new THREE.Plane(normal, radius));
    }
    return planeArray;
  }, [segments]);

  useFrame(() => {
    if (shipRef.current && materialRef.current) {
      const shipPosition = shipRef.current.position;

      position.set(shipPosition.x, shipPosition.y, shipPosition.z);

      planes.forEach((plane, i) => {
        const angle = (i / segments) * Math.PI * 2;
        const pointOnCircle = new THREE.Vector3(
          Math.cos(angle) * radius - shipPosition.x,
          0,
          Math.sin(angle) * radius - shipPosition.z
        );
        plane.constant = plane.normal.dot(pointOnCircle);
      });

      materialRef.current.clippingPlanes = planes;
    }
  });

  const materialRef = useRef(
    new THREE.MeshStandardMaterial({
      color: "orange",
      clippingPlanes: planes,
    })
  );

  const { scene } = useGLTF("/land.glb");

  useEffect(() => {
    const targetMesh = scene.getObjectByName("Plane");
    if (targetMesh && targetMesh instanceof THREE.Mesh) {
      targetMesh.material = materialRef.current;
      targetMesh.castShadow = true;
    }
  }, [scene]);

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={["black", 80, 120]} />

      {useOrbitControls ? <OrbitControls /> : <PerspectiveCamera />}

      <Physics debug={showDebugPhysics}>
        <FollowShip shipRef={shipRef} orbit={useOrbitControls}>
          {gameState === "normal" && (
            <Hand3D
              handLandmarkArrayRef={landmarksRef}
              shipUpdateFn={shipUpdate}
            />
          )}
          <hemisphereLight intensity={Math.PI / 5} />
        </FollowShip>

        <FollowLight shipRef={shipRef} />

        <DissolveMaterial
          baseMaterial={
            new THREE.MeshStandardMaterial({
              color: waterColor,
            })
          }
          mode="translate"
          thickness={0.1}
          feather={5}
          color={waterColor}
          intensity={0}
          shipRef={shipRef}
        />

        <RigidBody
          type="dynamic"
          colliders="trimesh"
          lockRotations
          lockTranslations
          userData={{ type: "land" }}
        >
          <primitive object={scene} />
        </RigidBody>

        {planes && <AnimatedVase clippingPlanes={planes} />}
        {showPlanes && <ClippingPlaneHelpers planes={planes} />}

        <Ship
          angleRad={shipOrientationRef}
          shipVelocity={shipVelocityRef}
          shipRef={shipRef}
        />

        <Bird shipRef={shipRef} baseRadius={3} initialPhase={200} />
        <Bird
          shipRef={shipRef}
          baseRadius={8}
          horizontalVariation={6}
          initialPhase={300}
          speed={0.5}
        />
        <Bird shipRef={shipRef} baseRadius={1} initialPhase={0} />

        {showPerf && <Perf position="bottom-right" />}

        <Suspense fallback={null}>
          <EffectComposer>
            <Bloom luminanceThreshold={0.9} />
          </EffectComposer>
        </Suspense>
      </Physics>
    </>
  );
};

type FollowShipProps = {
  shipRef: React.MutableRefObject<THREE.Mesh>;
  children: React.ReactNode;
  orbit: boolean;
};

const FollowShip = ({ shipRef, children, orbit }: FollowShipProps) => {
  const groupRef = useRef<THREE.Group>(null!);

  const { camera } = useThree();

  useFrame(() => {
    if (orbit) return;

    if (groupRef.current && shipRef.current) {
      groupRef.current.position.copy(shipRef.current.position);

      camera.position.x = shipRef.current.position.x + 50;
      camera.position.z = shipRef.current.position.z + 50;
      camera.position.y = 50;
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

export default SceneComposition;
