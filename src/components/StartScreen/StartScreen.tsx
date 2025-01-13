import { useState, useEffect } from "react";
import styles from "../common/common.module.css";
import { useGameStore } from "../../store";

const StartScreen = () => {
  const [shown, setShown] = useState(false);

  const { setGameState } = useGameStore();

  useEffect(() => {
    setTimeout(() => setShown(true), 100);
  }, []);

  return (
    <div className={styles.container} style={{ opacity: shown ? 1 : 0 }}>
      <p className={styles.message}>Welcome to the Argos journey.</p>

      <p className={styles.submessage} style={{ maxWidth: "800px" }}>
        This is a small game played with your hands. <br />
        You need to enable your camera to play. <br />
        The goal is to find the ancient artifact hidden in the scene. There you
        can find a message left by another player of the game and even create
        your own message for others to find. Use your index finger to point the
        ship and avoid the land.
      </p>

      <button className={styles.button} onClick={() => setGameState("normal")}>
        Start
      </button>
    </div>
  );
};

export default StartScreen;
