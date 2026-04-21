"use client";

import { useEffect, useRef, useState } from "react";
import type { PostureAnalysisResult } from "@/hooks/usePostureAnalysis";

export function useStablePosture(
  posture: PostureAnalysisResult,
  delayMs = 700,
): PostureAnalysisResult {
  const [stablePosture, setStablePosture] = useState<PostureAnalysisResult>(posture);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLabelRef = useRef<PostureAnalysisResult["label"] | null>(null);

  useEffect(() => {
    const stableLabel = stablePosture.label;
    const nextLabel = posture.label;

    // Same label: keep live posture data and cancel any pending transition
    if (stableLabel === nextLabel) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      pendingLabelRef.current = null;
      return;
    }

    // Already waiting to switch to this label -> do nothing
    if (pendingLabelRef.current === nextLabel) {
      return;
    }

    // New label transition
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    pendingLabelRef.current = nextLabel;

    timeoutRef.current = setTimeout(() => {
      setStablePosture(posture);
      pendingLabelRef.current = null;
      timeoutRef.current = null;
    }, delayMs);

    return () => {
      // do not clear here on every render,
      // otherwise the timer never survives long enough
    };
  }, [posture.label, posture, stablePosture.label, delayMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // If the stable label matches the raw label,
  // return the live posture object so metrics/reasons stay fresh.
  if (stablePosture.label === posture.label) {
    return posture;
  }

  return stablePosture;
}
