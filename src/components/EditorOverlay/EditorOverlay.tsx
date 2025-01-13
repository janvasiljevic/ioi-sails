import React from "react";
import styles from "../common/common.module.css";
import editorStyles from "./EditorOverlay.module.css";
import {
  IconHandFinger,
  IconHandGrab,
  IconHandStop,
} from "@tabler/icons-react";

type Props = {
  create: (name: string) => void;
};

const EditorOverlay = ({ create }: Props) => {
  const [name, setName] = React.useState("Anonymous");

  return (
    <div className={editorStyles.containerEditor}>
      <div className={editorStyles.instructionList}>
        <div className={editorStyles.instruction}>
          <IconHandStop />
          <p>
            To rotate the <b>camera</b> hold the <b>left hand</b> in a fist and
            drag.
          </p>
        </div>
        <div className={editorStyles.instruction}>
          <IconHandFinger />
          <p>
            Draw with the right hand and <b>pointed</b> finger.
          </p>
        </div>
        <div className={editorStyles.instruction}>
          <IconHandGrab />
          <p>
            To change the <b>hue</b> close the right hand into a fist and drag
            vertically.
          </p>
        </div>
      </div>

      <div className={editorStyles.bottom}>
        <input
          type="text"
          min={0}
          max={30}
          className={editorStyles.input}
          onChange={(e) => setName(e.target.value)}
          value={name}
        />

        <button
          className={styles.button}
          onClick={() => {
            create(name);
          }}
        >
          Publish
        </button>
      </div>
    </div>
  );
};

export default EditorOverlay;
