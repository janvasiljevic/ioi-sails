import { useGLTF } from "@react-three/drei";
import { memo, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";

const ShipModel = memo(function Ship() {
  const { scene } = useGLTF("/ship2.glb");

  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useLayoutEffect(() => {
    clone.traverse((o) => {
      if (
        o.type === "Mesh" &&
        o instanceof THREE.Mesh &&
        o.material.name === "Material"
      ) {
        o.castShadow = true;
      }
    });
  }, [clone]);

  return <primitive object={clone} />;
});

export default ShipModel;
