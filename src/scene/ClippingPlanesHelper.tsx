import React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface PlaneHelperProps {
  plane: THREE.Plane;
  size?: number;
  color?: THREE.ColorRepresentation;
}

const PlaneHelper: React.FC<PlaneHelperProps> = ({
  plane,
  size = 10,
  color = "red",
}) => {
  const helperRef = React.useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (helperRef.current) {
      const planeNormal = plane.normal.clone();
      helperRef.current.position.copy(
        planeNormal.multiplyScalar(-plane.constant)
      );
      helperRef.current.lookAt(
        helperRef.current.position.clone().add(plane.normal)
      );
    }
  });

  return (
    <mesh ref={helperRef}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        color={color}
        side={THREE.DoubleSide}
        transparent
        opacity={0.2}
      />
    </mesh>
  );
};

interface ClippingPlaneHelpersProps {
  planes: THREE.Plane[];
}

const ClippingPlaneHelpers: React.FC<ClippingPlaneHelpersProps> = ({
  planes,
}) => {
  return (
    <>
      {planes.map((plane, i) => (
        <PlaneHelper key={i} plane={plane} />
      ))}
    </>
  );
};

export default ClippingPlaneHelpers;
