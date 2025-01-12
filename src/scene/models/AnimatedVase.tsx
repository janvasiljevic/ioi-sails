import { useAnimations, useGLTF } from "@react-three/drei";
import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

useGLTF.preload("/vase_animated.glb");

const AnimatedVase = memo(function AnimatedVase() {
  const { scene, animations } = useGLTF("/vase_animated.glb");

  // Clone the scene properly with SkeletonUtils
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // Get animations for the cloned scene
  const { actions } = useAnimations(animations, clone);

  useEffect(() => {
    clone.scale.set(0.6, 0.6, 0.6);

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          // Add an emissive material to the vase
          child.material = new THREE.MeshStandardMaterial({
            color: "orange",
            emissive: "orange",
            emissiveIntensity: 2,
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
  }, [actions, clone]);

  return (
    <mesh position={[0, 1, 0]}>
      <primitive object={clone}></primitive>
    </mesh>
  );
});

export default AnimatedVase;
