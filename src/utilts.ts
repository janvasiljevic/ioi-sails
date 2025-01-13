import { NormalizedLandmark } from "@mediapipe/tasks-vision";
import * as THREE from "three";

export const isHandOpen = (landmarks: NormalizedLandmark[]): boolean => {
  const fingerIndices = [
    [9, 10, 11, 12], // Sredinec
    [13, 14, 15, 16], // Prstanc
    [17, 18, 19, 20], // Mezinec
    [5, 6, 7, 8], // Kazalec
  ];

  return fingerIndices.some((indices) => {
    const vectors = indices.slice(1).map((idx, i) => {
      const start = new THREE.Vector3(
        landmarks[indices[i]].x,
        landmarks[indices[i]].y,
        0
      );
      const end = new THREE.Vector3(landmarks[idx].x, landmarks[idx].y, 0);
      return calculateVector(start, end);
    });

    const angles = vectors
      .slice(1)
      .map((v, i) => calculateAngle(vectors[i], v));
    const angleThreshold = Math.PI / 4; // More lenient threshold for open hand

    return angles.every((angle) => angle < angleThreshold);
  });
};

export const isIndexFingerPointing = (
  landmarks: NormalizedLandmark[]
): boolean => {
  const indices = [5, 6, 7, 8];

  const vectors = indices.slice(1).map((idx, i) => {
    const start = new THREE.Vector3(
      landmarks[indices[i]].x,
      landmarks[indices[i]].y,
      0
    );
    const end = new THREE.Vector3(landmarks[idx].x, landmarks[idx].y, 0);
    return calculateVector(start, end);
  });

  const angles = vectors.slice(1).map((v, i) => calculateAngle(vectors[i], v));
  const angleThreshold = Math.PI / 8; // Adjust the threshold as needed

  return angles.every((angle) => angle < angleThreshold);
};

const calculateAngle = (v1: THREE.Vector3, v2: THREE.Vector3) => {
  return v1.angleTo(v2);
};

const calculateVector = (start: THREE.Vector3, end: THREE.Vector3) => {
  return new THREE.Vector3().subVectors(end, start).normalize();
};

export const calculateIndexFingerOrientation = (
  landmarks: NormalizedLandmark[]
): { x: number; y: number } => {
  const baseIndex = 5;
  const tipIndex = 8;

  const base = new THREE.Vector3(
    landmarks[baseIndex].x,
    landmarks[baseIndex].y,
    0
  );
  const tip = new THREE.Vector3(
    landmarks[tipIndex].x,
    landmarks[tipIndex].y,
    0
  );

  const direction = new THREE.Vector3().subVectors(tip, base).normalize();

  return { x: direction.x, y: direction.y };
};
