import { useAnimations, useGLTF } from "@react-three/drei";
import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

useGLTF.preload("/seagull.glb");

const BirdModel = memo(function Bird() {
  const { scene, animations } = useGLTF("/seagull.glb");

  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  const { actions } = useAnimations(animations, clone);

  useEffect(() => {
    clone.scale.set(0.6, 0.6, 0.6);

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          child.material = new THREE.MeshBasicMaterial({ color: "black" });
        }
      }
    });

    const action = actions["ArmatureAction"];
    if (action) {
      action.reset().play();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.setEffectiveTimeScale(4);
      action.clampWhenFinished = false;
    }

    return () => {
      if (action) {
        action.stop();
      }
    };
  }, [actions, clone]);

  return (
    <primitive object={clone}>
      <meshBasicMaterial color="white" />
    </primitive>
  );
});

export default BirdModel;
