import { useMemo } from "react";
import type { PoseLandmarkerResult } from "@mediapipe/tasks-vision";

type PostureResult = {
  shoulderTilt: number;
  headTilt: number;
  headSideOffset: number;
  isShoulderTilted: boolean;
  isHeadTilted: boolean;
  isHeadOffCenter: boolean;
  badPosture: boolean;
};

export function usePostureAnalysis(result: PoseLandmarkerResult | null): PostureResult | null {
  return useMemo(() => {
    const pose = result?.landmarks?.[0];
    if (!pose) return null;

    const leftEye = pose[2];
    const rightEye = pose[5];
    const leftShoulder = pose[11];
    const rightShoulder = pose[12];

    if (!leftEye || !rightEye || !leftShoulder || !rightShoulder) {
      return null;
    }

    const minVisibility = 0.6;

    const visibleEnough =
      (leftEye.visibility ?? 0) > minVisibility &&
      (rightEye.visibility ?? 0) > minVisibility &&
      (leftShoulder.visibility ?? 0) > minVisibility &&
      (rightShoulder.visibility ?? 0) > minVisibility;

    if (!visibleEnough) return null;

    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;

    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
    const headTilt = Math.abs(leftEye.y - rightEye.y);
    const headSideOffset = Math.abs(eyeMidX - shoulderMidX);

    const isShoulderTilted = shoulderTilt > 0.02;
    const isHeadTilted = headTilt > 0.012;
    const isHeadOffCenter = headSideOffset > 0.02;

    const badPosture = isShoulderTilted || isHeadTilted || isHeadOffCenter;

    return {
      shoulderTilt,
      headTilt,
      headSideOffset,
      isShoulderTilted,
      isHeadTilted,
      isHeadOffCenter,
      badPosture,
    };
  }, [result]);
}
