import { useState, useEffect } from "react";
import styles from "../common/common.module.css";
import { useGameStore } from "../../store";
import {
  IconAward,
  IconHandFinger,
  IconQuestionMark,
} from "@tabler/icons-react";
import { RefLandmarks } from "../../types";
import { HandOverlay } from "../HandOverlay/HandOverlay";

type Props = {
  landmarks: RefLandmarks;
};

const StartScreen = ({ landmarks }: Props) => {
  const [shown, setShown] = useState(false);
  const { setGameState } = useGameStore();

  const [timeToStart, setTimeToStart] = useState<number | null>(null);

  useEffect(() => {
    setTimeout(() => setShown(true), 100);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        !landmarks.current ||
        !landmarks.current.length ||
        landmarks.current.length == 0
      ) {
        setTimeToStart(null);
        return;
      }

      if (landmarks.current.length >= 1) {
        setTimeToStart((prev) => {
          if (prev === null) {
            return 3000;
          }

          if (prev === 0) {
            setGameState("normal");
            return null;
          }

          return prev - 100;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [landmarks, setGameState]);

  return (
    <div className={styles.container} style={{ opacity: shown ? 1 : 0 }}>
      <HandOverlay handLandmarkArrayRef={landmarks} handednessRef={null} />

      <p className={styles.message}>Welcome to the Argos journey.</p>

      <p className={styles.submessage} style={{ maxWidth: "80vw" }}>
        <IconQuestionMark className={styles.icon} /> This is a small game played
        with your hands. You need to enable your camera to play. <br /> <br />
        <IconAward className={styles.icon} /> The goal is to find the ancient
        artifact hidden in the scene. There you can find a message left by
        another player of the game and even create your own message for others
        to find.
        <br /> <br />
        <IconHandFinger className={styles.icon} /> Use your index finger to
        point the ship and avoid the land.
      </p>

      <button className={styles.button} onClick={() => setGameState("normal")}>
        {timeToStart
          ? `Starting in ${timeToStart / 1000} seconds...`
          : "Click to start or show your hand to auto start"}
      </button>
    </div>
  );
};

export default StartScreen;
