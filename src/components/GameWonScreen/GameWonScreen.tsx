import { useState, useEffect } from "react";
import styles from "../common/common.module.css";
import VaseView from "../../scene/VaseView";
import { useGameStore } from "../../store";
import { Tables } from "../../database.types";
import { supabase } from "../../supa-client";

const GameWonScreen = () => {
  const [shown, setShown] = useState(false);

  const [texture, setTexture] = useState<Tables<"textures"> | null>(null);
  const [createdBy, setCreatedBy] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => setShown(true), 100);
  }, []);

  useEffect(() => {
    const fetchTexture = async () => {
      const a = await supabase.rpc("get_random_texture", {});

      if (a.data && a.data.length > 0) {
        setTexture(a.data[0]);
        setCreatedBy(a.data[0].created_by);
      }
    };

    fetchTexture();
  }, []);

  const { setGameState } = useGameStore();

  return (
    <div className={styles.container} style={{ opacity: shown ? 1 : 0 }}>
      <p className={styles.message}>
        Congratulations, you have found the ancient artifact!
      </p>

      <p className={styles.submessage}>It was left by the user `{createdBy}`</p>

      {texture && <VaseView textureBase64={texture?.texture} />}

      <button className={styles.button} onClick={() => setGameState("editor")}>
        Create your own artifact
      </button>

      <button
        className={styles.button}
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </div>
  );
};

export default GameWonScreen;
