"use client";

import { useEffect, useRef, useState } from "react";
import type { PostureAnalysisResult } from "@/hooks/usePostureAnalysis";

export function useBadPostureAlert(
  posture: PostureAnalysisResult,
  firstDelayMs = 30000,
  repeatDelayMs = 25000,
) {
  const [showAlert, setShowAlert] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBadPostureRef = useRef(false);

  useEffect(() => {
    isBadPostureRef.current = posture.label === "bad";

    if (!isBadPostureRef.current) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      queueMicrotask(() => {
        setShowAlert(false);
      });

      return;
    }

    if (timerRef.current) return;

    const triggerAlert = () => {
      if (!isBadPostureRef.current) {
        timerRef.current = null;
        return;
      }

      setShowAlert(true);
      setAlertCount((count) => count + 1);

      timerRef.current = setTimeout(triggerAlert, repeatDelayMs);
    };

    timerRef.current = setTimeout(triggerAlert, firstDelayMs);

    return () => {
      // Do not clear here on every render.
    };
  }, [posture.label, firstDelayMs, repeatDelayMs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const dismissAlert = () => {
    setShowAlert(false);
  };

  return {
    showAlert,
    alertCount,
    dismissAlert,
  };
}
