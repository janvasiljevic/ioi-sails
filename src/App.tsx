import { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { OrbitControls } from "@react-three/drei";
import { Canvas, extend } from "@react-three/fiber";
import { Leva } from "leva";
import { Suspense, useRef } from "react";
import { OutlineEffect } from "three/examples/jsm/Addons.js";
import HandRecognition from "./recognition/HandRecognition";
import SceneComposition from "./SceneComposition";

extend({ OutlineEffect });
extend({ OrbitControls });

function App() {
  const landmarksRef = useRef<NormalizedLandmark[][] | null>([]);

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100vh" }}
      className="bg"
    >
      <Leva flat neverHide />
      <div style={{ position: "absolute", top: 0, left: 0, zIndex: 1000 }}>
        <HandRecognition handLandmarkArrayRef={landmarksRef} />
      </div>
      <Canvas camera={{ zoom: 3, position: [50, 50, 50] }} shadows>
        <Suspense fallback={<>Loading</>}>
          <SceneComposition landmarksRef={landmarksRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
