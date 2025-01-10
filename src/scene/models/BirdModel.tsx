import { useAnimations, useGLTF } from "@react-three/drei";
import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

useGLTF.preload("/seagull.glb");

const BirdModel = memo(function Bird() {
  const { scene, animations } = useGLTF("/seagull.glb");

  // Clone the scene properly with SkeletonUtils
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // Get animations for the cloned scene
  const { actions } = useAnimations(animations, clone);

  useEffect(() => {
    clone.scale.set(0.6, 0.6, 0.6);

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

  return <primitive object={clone} />;
});

export default BirdModel;
