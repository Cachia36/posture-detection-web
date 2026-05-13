"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PostureAnalysisResult } from "@/hooks/usePostureAnalysis";

export function useBadPostureAlert(
  posture: PostureAnalysisResult,
  firstDelayMs = 30000,
  repeatDelayMs = 25000,
  isMonitoring = false,
) {
  const [showAlert, setShowAlert] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearAlertTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    if (!isMonitoring || posture.label !== "bad") {
      clearAlertTimer();
      queueMicrotask(() => {
        setShowAlert(false);
      });
      return;
    }

    if (timerRef.current) return;

    const triggerAlert = () => {
      setShowAlert(true);
      setAlertCount((count) => count + 1);

      timerRef.current = setTimeout(triggerAlert, repeatDelayMs);
    };

    timerRef.current = setTimeout(triggerAlert, firstDelayMs);

    return () => {
      clearAlertTimer();
    };
  }, [posture.label, firstDelayMs, repeatDelayMs, isMonitoring]);

  const dismissAlert = useCallback(() => {
    setShowAlert(false);
  }, []);

  return {
    showAlert,
    alertCount,
    dismissAlert,
  };
}
