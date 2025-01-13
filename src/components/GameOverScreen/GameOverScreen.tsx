import { useState, useEffect } from "react";
import styles from "../common/common.module.css";

const GameOverScreen = () => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setTimeout(() => setShown(true), 100);
  }, []);

  return (
    <div className={styles.container} style={{ opacity: shown ? 1 : 0 }}>
      <p className={styles.message}>
        Sadly, you have crashed the ship. Your journey ends here.
      </p>

      <p className={styles.submessage}>Rest your hands a while.</p>

      <button
        className={styles.button}
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </div>
  );
};

export default GameOverScreen;
