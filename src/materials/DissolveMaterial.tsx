import { useFrame } from "@react-three/fiber";
import { patchShaders } from "gl-noise";
import * as React from "react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import CSM from "three-custom-shader-material";

interface DissolveMaterialProps {
  baseMaterial?: THREE.Material;
  mode: string;
  thickness?: number;
  feather?: number;
  color?: string;
  intensity?: number;
  shipRef: React.MutableRefObject<THREE.Mesh>;
}

export function DissolveMaterial({
  baseMaterial,
  thickness = 0.1,
  feather = 2,
  color = "#14c445",
  intensity = 5,
  shipRef,
}: DissolveMaterialProps) {
  const meshRef = useRef<THREE.Mesh>(null!);

  const uniforms = useMemo(
    () => ({
      uMatrix: {
        value: (() => {
          const o = new THREE.Object3D();
          o.scale.setScalar(5);
          o.updateMatrixWorld();
          return o.matrixWorld;
        })(),
      },
      uFeather: { value: feather },
      uThickness: { value: thickness },
      uColor: { value: new THREE.Color(color).multiplyScalar(intensity) },
      uTime: { value: 0 }, // Time uniform for wave animation
    }),
    [color, feather, intensity, thickness]
  );

  useEffect(
    () => void (uniforms.uFeather.value = feather),
    [feather, uniforms.uFeather]
  );
  useEffect(
    () => void (uniforms.uThickness.value = thickness),
    [thickness, uniforms.uThickness]
  );
  useEffect(
    () => void uniforms.uColor.value.set(color).multiplyScalar(intensity),
    [color, intensity, uniforms.uColor.value]
  );

  useEffect(() => {
    const geometry = new THREE.PlaneGeometry(500, 500, 150, 150);
    geometry.rotateX(-Math.PI * 0.5);

    const amplitude = new Float32Array(geometry.attributes.position.count);
    const phase = new Float32Array(geometry.attributes.position.count);

    // Get the position attribute for calculating based on position
    const positions = geometry.attributes.position.array;

    for (let i = 0; i < geometry.attributes.position.count; i++) {
      // Use position-based values for more coherent waves
      const xPos = positions[i * 3];
      const zPos = positions[i * 3 + 2];

      // Create amplitude based on distance from center
      const distanceFromCenter = Math.sqrt(xPos * xPos + zPos * zPos) / 100;
      amplitude[i] = 0.5 * (1 - distanceFromCenter); // Amplitude decreases from center

      // Create phase based on position for traveling waves
      phase[i] = xPos * 0.1 + zPos * 0.1; // Diagonal wave pattern
    }

    geometry.setAttribute("amplitude", new THREE.BufferAttribute(amplitude, 1));
    geometry.setAttribute("phase", new THREE.BufferAttribute(phase, 1));

    if (meshRef.current) {
      meshRef.current.geometry = geometry;
    }
  }, []);

  const vertexShader = useMemo(
    () => /* glsl */ `
      varying vec2 custom_vUv;
      varying vec3 custom_vPosition;
      varying vec3 custom_vBoxUv;

      uniform vec3 uBoxMin;
      uniform vec3 uBoxMax;

      uniform float uTime;

      attribute float amplitude;  // Per-vertex amplitude
      attribute float phase;     // Per-vertex phase


      void main() {
        custom_vUv = uv;
        custom_vPosition = position;
        
        // Create multiple wave components for more interesting motion
        float wave1 = sin(uTime * 1.5 + phase) * amplitude;
        float wave2 = sin(uTime * 2.3 + phase * 1.5) * amplitude * 0.5;
        
        // Combine waves
        csm_Position.y += wave1 + wave2;
        
        custom_vBoxUv = (position - uBoxMin) / (uBoxMax - uBoxMin);
      }}
    `,
    []
  );

  const fragmentShader = useMemo(
    () =>
      patchShaders(/* glsl */ `
        varying vec2 custom_vUv;
        varying vec3 custom_vPosition;
        varying vec3 custom_vBoxUv;

        uniform mat4 uMatrix;
        uniform float uFeather;
        uniform float uThickness;
        uniform sampler2D uRamp;
        uniform vec3 uColor;
     

        float sdfBox(vec3 p, vec3 b) {
          vec3 q = abs(p) - b;
          return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
        }

        vec3 transform(vec3 p) {
          return (inverse(uMatrix) * vec4(p, 1.0)).xyz;
        }


        void main() {
            // Simplex noise 
            // Seed, persistance, lacunarity, scale, redistribution, octaves, terbulence, ridge
          gln_tFBMOpts opts = gln_tFBMOpts(1.0, 0.3, 2.0, 1.0, 1.0, 5, false, false);
          float noise = gln_sfbm(custom_vPosition, opts);
          noise = gln_normalize(noise);

          vec3 transformed = transform(custom_vPosition);
          float distance = smoothstep(0.0, uFeather, sdfBox(transformed, vec3(0.75)));

          float progress = distance;

          // float alpha = step(1.0 - progress, noise);
          float alpha = 1.0 - step(1.0 - progress, noise);
          // clip alpha to 0.1
          // alpha = max(alpha, 0.1);

          // float border = step((1.0 - progress) - uThickness, noise) - alpha;
          float border = 1.0 - (step((1.0 - progress) - uThickness, noise) - alpha);

          csm_DiffuseColor.a = alpha + border;
          // csm_DiffuseColor.rgb = mix(csm_DiffuseColor.rgb, uColor, border);
          // csm_DiffuseColor.rgb = mix(uColor, csm_DiffuseColor.rgb, border);
        }
      `) as string,
    []
  );

  const groupRef = React.useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    groupRef.current.position.copy(shipRef.current.position);
    uniforms.uMatrix.value.copy(groupRef.current.matrixWorld);

    // Update time uniform
    uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <>
      <mesh ref={meshRef} receiveShadow>
        <CSM
          key={vertexShader + fragmentShader}
          baseMaterial={baseMaterial!}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh ref={groupRef} scale={4} />
    </>
  );
}
