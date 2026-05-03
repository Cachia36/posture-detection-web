import { useMemo } from "react";
import type { PoseLandmarkerResult } from "@mediapipe/tasks-vision";

export type PostureMetrics = {
  shoulderTilt: number;
  headTilt: number;
  headSideOffset: number;
};

export type PostureBaseline = PostureMetrics;

export type PostureAnalysisResult =
  | {
      label: "no-pose";
      reasons: string[];
      metrics: null;
    }
  | {
      label: "good" | "bad";
      reasons: string[];
      metrics: PostureMetrics;
    };

export function usePostureAnalysis(
  result: PoseLandmarkerResult | null,
  baseline?: PostureBaseline | null,
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

    const metrics: PostureMetrics = {
      shoulderTilt: Math.abs(leftShoulder.y - rightShoulder.y),
      headTilt: Math.abs(leftEye.y - rightEye.y),
      headSideOffset: Math.abs(nose.x - shoulderMidX),
    };

    const shoulderTiltValue = baseline
      ? Math.abs(metrics.shoulderTilt - baseline.shoulderTilt)
      : metrics.shoulderTilt;

    const headTiltValue = baseline
      ? Math.abs(metrics.headTilt - baseline.headTilt)
      : metrics.headTilt;

    const headSideOffsetValue = baseline
      ? Math.abs(metrics.headSideOffset - baseline.headSideOffset)
      : metrics.headSideOffset;

    const isShoulderTilted = shoulderTiltValue > 0.025;
    const isHeadTilted = headTiltValue > 0.018;
    const isHeadOffCenter = headSideOffsetValue > 0.03;

    const reasons: string[] = [];

    if (isHeadTilted) reasons.push("Head tilted");
    if (isHeadOffCenter) reasons.push("Head off-center");
    if (isShoulderTilted) reasons.push("Uneven shoulders");

    return {
      label: reasons.length > 0 ? "bad" : "good",
      reasons,
      metrics,
    };
  }, [result, baseline]);
}
