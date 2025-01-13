import { Environment, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";

type VaseViewProps = {
  textureBase64: string;
  rotationSpeed?: number; // Rotations per second
};
function RotatingVase({ textureBase64, rotationSpeed = 0.1 }: VaseViewProps) {
  const { nodes } = useGLTF("/vase.glb");
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Load the texture from base64
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(textureBase64, (loadedTexture) => {
      setTexture(loadedTexture);
    });
  }, [textureBase64]);

  // Rotate the vase
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * Math.PI * 2 * rotationSpeed;
    }
  });

  // Get the first mesh from the loaded model
  const firstMesh = Object.values(nodes).find(
    (node): node is THREE.Mesh => node instanceof THREE.Mesh
  );
  if (!firstMesh) return null;
  if (!texture) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={firstMesh.geometry}
      castShadow
      receiveShadow
      rotation={[0, Math.PI, Math.PI / 36]}
    >
      <meshStandardMaterial
        metalness={0}
        roughness={1}
        side={THREE.DoubleSide}
        map={texture || null}
      />
    </mesh>
  );
}

export default function VaseView({
  textureBase64,
  rotationSpeed,
}: VaseViewProps) {
  return (
    <div style={{ height: "500px", width: "500px" }}>
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera
            makeDefault
            position={[0, 5, 5]}
            fov={60}
            rotation={[-Math.PI / 5, 0, 0]}
          />
          <Environment preset="sunset" />
          <ambientLight intensity={0.5} />
          <spotLight position={[0, 2, 10]} intensity={1} castShadow />
          <spotLight position={[-10, 2, -5]} intensity={1} castShadow />
          <spotLight position={[10, 2, -5]} intensity={1} castShadow />
          <RotatingVase
            textureBase64={textureBase64}
            rotationSpeed={rotationSpeed}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
