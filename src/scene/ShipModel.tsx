import { useGLTF } from "@react-three/drei";
import { useControls } from "leva";
import { memo, useMemo, useLayoutEffect } from "react";
import * as THREE from "three";

const ShipModel = memo(function Ship() {
  const { scene } = useGLTF("/ship.glb");

  const { shipColor } = useControls({
    shipColor: "#eeb288",
  });

  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useLayoutEffect(() => {
    const material = new THREE.MeshStandardMaterial({ color: shipColor });
    clonedScene.traverse((o) => {
      if (o.type === "Mesh" && o instanceof THREE.Mesh) {
        o.material = material;
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }, [clonedScene, shipColor]);

  return (
    <mesh scale={0.3}>
      <primitive object={clonedScene} />;
    </mesh>
  );
});

export default ShipModel;
