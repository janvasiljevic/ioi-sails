import { TransformControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { patchShaders } from "gl-noise";
import * as React from "react";
import * as THREE from "three";
import CSM from "three-custom-shader-material";

interface DissolveMaterialProps {
  baseMaterial?: THREE.Material;
  mode: string;
  thickness?: number;
  feather?: number;
  color?: string;
  intensity?: number;
  debug?: boolean;
}

export function DissolveMaterial({
  baseMaterial,
  mode,
  thickness = 0.1,
  feather = 2,
  color = "#14c445",
  intensity = 5,
  debug = false,
}: DissolveMaterialProps) {
  const uniforms = React.useMemo(
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
    }),
    []
  );

  // prettier-ignore
  React.useEffect(() => void (uniforms.uFeather.value = feather), [feather]);
  // prettier-ignore
  React.useEffect(() => void (uniforms.uThickness.value = thickness), [thickness]);
  // prettier-ignore
  React.useEffect(() => void (uniforms.uColor.value.set(color).multiplyScalar(intensity)), [color, intensity]);

  const vertexShader = React.useMemo(
    () => /* glsl */ `
      varying vec2 custom_vUv;
      varying vec3 custom_vPosition;
      varying vec3 custom_vBoxUv;

      uniform vec3 uBoxMin;
      uniform vec3 uBoxMax;

      void main() {
        custom_vUv = uv;
        custom_vPosition = position;

        custom_vBoxUv = (position - uBoxMin) / (uBoxMax - uBoxMin);
      }
    `,
    []
  );

  const fragmentShader = React.useMemo(
    () =>
      patchShaders(/* glsl */ `
        // Passed from vertex shader
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

  useFrame(() => {
    if (!groupRef.current) return;
    uniforms.uMatrix.value.copy(groupRef.current.matrixWorld);
  });

  return (
    <>
      <CSM
        key={vertexShader + fragmentShader}
        baseMaterial={baseMaterial!}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        toneMapped={false}
        transparent
      />

      {debug && (
        <TransformControls mode={mode as any} scale={0.5}>
          <mesh ref={groupRef} scale={10}>
            <boxGeometry args={[2, 2, 2]} />
            <meshBasicMaterial wireframe />
          </mesh>
        </TransformControls>
      )}
    </>
  );
}
