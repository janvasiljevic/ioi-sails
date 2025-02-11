import { useEffect, useState } from "react";

import styles from "./../common/common.module.css";

const SubmittedMessage = () => {
  const [timer, setTimer] = useState(5000);

  // When subbmited start timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 0) {
          clearInterval(interval);
          window.location.href = "/";
          window.location.reload();

          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container} style={{ opacity: 1, zIndex: 2 }}>
      <p className={styles.message}>Thanks for submitting your artifact.</p>
      <p className={styles.submessage}>Another adventurer will find it soon.</p>

      <p className={styles.submessage}>
        The game will restart in {timer / 1000}s
      </p>
    </div>
  );
};

export default SubmittedMessage;
