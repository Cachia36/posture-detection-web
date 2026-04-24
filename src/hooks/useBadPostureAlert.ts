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

    useEffect(() => {
        const clearAlertTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };

        const triggerAlert = () => {
            setShowAlert(true);
            setAlertCount((count) => count + 1);

            timerRef.current = setTimeout(triggerAlert, repeatDelayMs);
        };

        if (posture.label !== "bad") {
            clearAlertTimer();
            setShowAlert(false);
            setAlertCount(0);
            return;
        }

        if (!timerRef.current) {
            timerRef.current = setTimeout(triggerAlert, firstDelayMs);
        }

        return () => {
            // do not clear here every render
        };
    }, [posture.label, firstDelayMs, repeatDelayMs]);

    const dismissAlert = () => {
        setShowAlert(false);
    };

    return {
        showAlert,
        alertCount,
        dismissAlert,
    };
}