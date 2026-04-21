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

export function usePostureAnalysis(
  result: PoseLandmarkerResult | null,
): PostureAnalysisResult {
  return useMemo(() => {
    const pose = result?.landmarks?.[0];
    if (!pose) {
      return {
        label: "no-pose",
        reasons: [],
        metrics: null,
      };
    }

    const leftEye = pose[2];
    const rightEye = pose[5];
    const leftShoulder = pose[11];
    const rightShoulder = pose[12];

    if (!leftEye || !rightEye || !leftShoulder || !rightShoulder) {
      return {
        label: "no-pose",
        reasons: [],
        metrics: null,
      };
    }

    const minVisibility = 0.6;

    const visibleEnough =
      (leftEye.visibility ?? 0) > minVisibility &&
      (rightEye.visibility ?? 0) > minVisibility &&
      (leftShoulder.visibility ?? 0) > minVisibility &&
      (rightShoulder.visibility ?? 0) > minVisibility;

    if (!visibleEnough) {
      return {
        label: "no-pose",
        reasons: [],
        metrics: null,
      };
    }

    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;

    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
    const headTilt = Math.abs(leftEye.y - rightEye.y);
    const headSideOffset = Math.abs(eyeMidX - shoulderMidX);

    const isShoulderTilted = shoulderTilt > 0.035
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