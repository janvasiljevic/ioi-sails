import { useThree, useFrame } from "@react-three/fiber";
import { Dispatch, SetStateAction, useRef, useEffect } from "react";
import { DissolveMaterial } from "../materials/DissolveMaterial";

import * as THREE from "three";
import { VertexData } from "../types";
import { useControls } from "leva";

type IPlaneProps = {
  vertData: VertexData[];
  setVertData: Dispatch<SetStateAction<VertexData[]>>;
  shipRef: React.MutableRefObject<THREE.Mesh>;
};

const WaterPlane = ({ vertData, setVertData, shipRef }: IPlaneProps) => {
  const { waterColor } = useControls({
    waterColor: "#9badb7",
  });

  const meshRef = useRef<THREE.Mesh>(null!);

  const { clock } = useThree();

  useEffect(() => {
    if (!meshRef.current) return;

    const t = 200;

    const g = new THREE.PlaneGeometry(t, t, t, t);
    g.rotateX(-Math.PI * 0.5);
    const vertData = [];
    const v3 = new THREE.Vector3();
    for (let i = 0; i < g.attributes.position.count; i++) {
      v3.fromBufferAttribute(g.attributes.position, i);
      vertData.push({
        initH: v3.y,
        amplitude: THREE.MathUtils.randFloatSpread(2 / 4),
        phase: THREE.MathUtils.randFloat(0, Math.PI),
      });
    }
    meshRef.current.geometry = g;
    setVertData(vertData);
  }, [setVertData]);

  useFrame(() => {
    const time = clock.getElapsedTime();

    if (meshRef.current) {
      vertData.forEach((vd, idx) => {
        const y = vd.initH + Math.sin(time + vd.phase) * vd.amplitude;
        meshRef.current.geometry.attributes.position.setY(idx, y);
      });
      meshRef.current.geometry.attributes.position.needsUpdate = true;
      meshRef.current.geometry.computeVertexNormals();
    }
  });

  return (
    <mesh ref={meshRef} receiveShadow>
      <planeGeometry attach="geometry" args={[50, 50, 15, 15]} />
      <DissolveMaterial
        baseMaterial={new THREE.MeshStandardMaterial({ color: waterColor })}
        mode="translate"
        thickness={0.1}
        feather={5}
        color={waterColor}
        intensity={0}
        shipRef={shipRef}
      />
    </mesh>
  );
};

export default WaterPlane;
