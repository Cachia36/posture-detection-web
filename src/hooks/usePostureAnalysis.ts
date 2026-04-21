import { useMemo } from "react";
import type { PoseLandmarkerResult } from "@mediapipe/tasks-vision";

export type PostureAnalysisResult =
  | {
      label: "no-pose";
      reasons: string[];
      metrics: null;
    }
  | {
      label: "good" | "bad";
      reasons: string[];
      metrics: {
        shoulderTilt: number;
        headTilt: number;
        headSideOffset: number;
      };
    };

export function usePostureAnalysis(result: PoseLandmarkerResult | null): PostureAnalysisResult {
  return useMemo(() => {
    const pose = result?.landmarks?.[0];
    if (!pose) {
      return {
        label: "no-pose",
        reasons: [],
        metrics: null,
      };
    }

    const nose = pose[0];
    const leftEye = pose[2];
    const rightEye = pose[5];
    const leftShoulder = pose[11];
    const rightShoulder = pose[12];

    if (!nose || !leftEye || !rightEye || !leftShoulder || !rightShoulder) {
      return {
        label: "no-pose",
        reasons: [],
        metrics: null,
      };
    }

    const minVisibility = 0.35;

    const visibleEnough =
      (nose.visibility ?? 1) >= minVisibility &&
      (leftEye.visibility ?? 1) >= minVisibility &&
      (rightEye.visibility ?? 1) >= minVisibility &&
      (leftShoulder.visibility ?? 1) >= minVisibility &&
      (rightShoulder.visibility ?? 1) >= minVisibility;

    if (!visibleEnough) {
      return {
        label: "no-pose",
        reasons: [],
        metrics: null,
      };
    }

    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;

    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
    const headTilt = Math.abs(leftEye.y - rightEye.y);
    const headSideOffset = Math.abs(nose.x - shoulderMidX);

    const isShoulderTilted = shoulderTilt > 0.035;
    const isHeadTilted = headTilt > 0.02;
    const isHeadOffCenter = headSideOffset > 0.04;

    const reasons: string[] = [];

    if (isHeadTilted) reasons.push("Head tilted");
    if (isHeadOffCenter) reasons.push("Head off-center");
    if (isShoulderTilted) reasons.push("Uneven shoulders");

    return {
      label: reasons.length > 0 ? "bad" : "good",
      reasons,
      metrics: {
        shoulderTilt,
        headTilt,
        headSideOffset,
      },
    };
  }, [result]);
}
