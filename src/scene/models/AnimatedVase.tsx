import { useAnimations, useGLTF } from "@react-three/drei";
import { CylinderCollider, RigidBody } from "@react-three/rapier";
import { useControls } from "leva";
import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import { useDistanceStore } from "../../store";

useGLTF.preload("/vase_animated.glb");
useGLTF.preload("/points.glb");

type Props = {
  clippingPlanes: THREE.Plane[];
};

const AnimatedVase = memo(function AnimatedVase({ clippingPlanes }: Props) {
  const { scene, animations } = useGLTF("/vase_animated.glb");
  const points = useGLTF("/points.glb");

  const { targetPosition } = useDistanceStore();

  const { easyMode } = useControls({
    easyMode: false,
  });

  const spawnPoints = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    points.scene.traverse((child) => {
      // A B C...
      if (child.name.match(/^[A-Z]$/)) {
        positions.push(child.position);
      }
    });
    return positions;
  }, [points]);

  const randomPosition = useMemo(() => {
    if (easyMode) {
      return new THREE.Vector3(0, 0, 0);
    }

    const randomIndex = Math.floor(Math.random() * spawnPoints.length);
    return spawnPoints[randomIndex];
  }, [spawnPoints, easyMode]);

  useEffect(() => {
    targetPosition.set(
      randomPosition.x,
      randomPosition.y + 1,
      randomPosition.z
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [randomPosition]);

  // Clone the scene properly with SkeletonUtils
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // Get animations for the cloned scene
  const { actions } = useAnimations(animations, clone);

  useEffect(() => {
    clone.scale.set(0.6, 0.6, 0.6);

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          child.material = new THREE.MeshStandardMaterial({
            color: "orange",
            emissive: "orange",
            emissiveIntensity: 2,
            clippingPlanes,
          });
        }
      }
    });

    const action = actions["SM_Vase 32Action"];
    if (action) {
      action.reset().play();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.setEffectiveTimeScale(1);
      action.clampWhenFinished = false;
    }

    return () => {
      if (action) {
        action.stop();
      }
    };
  }, [actions, clippingPlanes, clone]);

  return (
    <mesh position={[randomPosition.x, randomPosition.y + 1, randomPosition.z]}>
      <primitive object={clone} />

      <RigidBody
        type="dynamic"
        lockRotations
        lockTranslations
        userData={{ type: "reward" }}
      >
        <CylinderCollider args={[4, 2]} />
      </RigidBody>
    </mesh>
  );
});

export default AnimatedVase;
