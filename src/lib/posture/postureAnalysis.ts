import { POSE_LANDMARKS } from "./landmarks";

export type Point = {
  x: number;
  y: number;
};

export type PostureLabel = "good" | "bad" | "no-pose";

export type PostureAnalysisResult = {
  label: PostureLabel;
  reasons: string[];
  metrics: {
    headTiltDeg: number;
    shoulderTiltDeg: number;
    headOffsetPx: number;
    trunkLeanDeg: number;
  };
};

type NormalizedLandmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

function toPx(landmark: NormalizedLandmark, width: number, height: number): Point {
  return {
    x: landmark.x * width,
    y: landmark.y * height,
  };
}

function lineAngleDeg(a: Point, b: Point): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

function midpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

export function analyzePostureFromLandmarks(
  landmarks: NormalizedLandmark[] | undefined,
  width: number,
  height: number,
): PostureAnalysisResult {
  if (!landmarks || landmarks.length === 0) {
    return {
      label: "no-pose",
      reasons: [],
      metrics: {
        headTiltDeg: 0,
        shoulderTiltDeg: 0,
        headOffsetPx: 0,
        trunkLeanDeg: 0,
      },
    };
  }

  const nose = toPx(landmarks[POSE_LANDMARKS.NOSE], width, height);
  const leftEar = toPx(landmarks[POSE_LANDMARKS.LEFT_EAR], width, height);
  const rightEar = toPx(landmarks[POSE_LANDMARKS.RIGHT_EAR], width, height);
  const leftShoulder = toPx(landmarks[POSE_LANDMARKS.LEFT_SHOULDER], width, height);
  const rightShoulder = toPx(landmarks[POSE_LANDMARKS.RIGHT_SHOULDER], width, height);
  const leftHip = toPx(landmarks[POSE_LANDMARKS.LEFT_HIP], width, height);
  const rightHip = toPx(landmarks[POSE_LANDMARKS.RIGHT_HIP], width, height);

  const reasons: string[] = [];

  const earLineAngle = Math.abs(lineAngleDeg(leftEar, rightEar));
  const shoulderLineAngle = Math.abs(lineAngleDeg(leftShoulder, rightShoulder));

  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);

  const headOffsetPx = Math.abs(nose.x - shoulderMid.x);

  // vertical trunk = around 90 or -90 degrees, so compare against 90
  const trunkAngle = Math.abs(lineAngleDeg(shoulderMid, hipMid));
  const trunkLeanDeg = Math.abs(90 - trunkAngle);

  if (earLineAngle > 8) {
    reasons.push("Head tilted");
  }

  if (headOffsetPx > width * 0.06) {
    reasons.push("Head off-center");
  }

  if (shoulderLineAngle > 6) {
    reasons.push("Uneven shoulders");
  }

  if (trunkLeanDeg > 10) {
    reasons.push("Leaning to one side");
  }

  return {
    label: reasons.length === 0 ? "good" : "bad",
    reasons,
    metrics: {
      headTiltDeg: earLineAngle,
      shoulderTiltDeg: shoulderLineAngle,
      headOffsetPx,
      trunkLeanDeg,
    },
  };
}
