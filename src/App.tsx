import { Category, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, extend } from "@react-three/fiber";
import { Leva } from "leva";
import { Suspense, useEffect, useRef, useState } from "react";
import { OutlineEffect } from "three/examples/jsm/Addons.js";
import GameOverScreen from "./components/GameOverScreen/GameOverScreen";
import GameWonScreen from "./components/GameWonScreen/GameWonScreen";
import HandRecognition from "./recognition/HandRecognition";
import PaintableVaseScene from "./scene/PaintableVaseScene";
import SceneComposition from "./SceneComposition";
import { useDistanceStore, useGameStore } from "./store";

import useSound from "use-sound";
import boopSfx from "./sfx/waves.mp3";

import styles from "./components/common/common.module.css";
import StartScreen from "./components/StartScreen/StartScreen";

extend({ OutlineEffect });
extend({ OrbitControls });

useGLTF.preload("/vase.glb");

function App() {
  const landmarksRef = useRef<NormalizedLandmark[][] | null>([]);
  const handednessRef = useRef<Category[][] | null>(null);

  const [play, { stop }] = useSound(boopSfx);

  const { gameState } = useGameStore();

  useEffect(() => {
    if (gameState === "normal") {
      play();
    }
    if (gameState === "editor") {
      stop();
    }
  }, [gameState, play, stop]);

  if (gameState === "editor") {
    return <PaintableVaseScene />;
  }

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100vh" }}
      className="bg"
    >
      {/* <Leva flat neverHide /> */}
      <Leva flat hidden={import.meta.env.PROD} />
      <div style={{ position: "absolute", top: 0, left: 0, zIndex: 1000 }}>
        <HandRecognition
          handLandmarkArrayRef={landmarksRef}
          handednessRef={handednessRef}
        />
      </div>

      {gameState === "start" && <StartScreen landmarks={landmarksRef} />}
      {gameState === "gameOver" && <GameOverScreen />}
      {gameState === "gameWon" && <GameWonScreen landmarks={landmarksRef} />}

      <Canvas
        camera={{ zoom: 3.5, position: [50, 50, 50] }}
        shadows
        gl={{ localClippingEnabled: true }}
      >
        <Suspense fallback={null}>
          <SceneComposition landmarksRef={landmarksRef} />
        </Suspense>
      </Canvas>
      <Counter />
    </div>
  );
}

const Counter = () => {
  const { targetPosition, position } = useDistanceStore();

  const [distance, setDistance] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setDistance(position.distanceTo(targetPosition));
    }, 1000);

    return () => clearInterval(interval);
  }, [position, targetPosition]);

  return (
    <div className={styles.counter}>
      <p>{distance.toFixed(2)}m</p>
    </div>
  );
};

export default App;
