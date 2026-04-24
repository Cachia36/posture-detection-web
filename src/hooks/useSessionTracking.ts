"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PostureAnalysisResult } from "@/hooks/usePostureAnalysis";

type PostureLabel = "good" | "bad" | "no-pose";

export type PostureLogEntry = {
    timestamp: number;
    label: PostureLabel;
    reasons: string[];
};

export type AlertLogEntry = {
    timestamp: number;
};

export type SessionSummary = {
    sessionStart: number | null;
    sessionEnd: number | null;
    sessionDurationMs: number;
    goodPostureMs: number;
    badPostureMs: number;
    noPoseMs: number;
    poorPostureDetections: number;
    alertsTriggered: number;
    issueCounts: {
        headTilted: number;
        headOffCenter: number;
        unevenShoulders: number;
    };
};

function emptySummary(): SessionSummary {
    return {
        sessionStart: null,
        sessionEnd: null,
        sessionDurationMs: 0,
        goodPostureMs: 0,
        badPostureMs: 0,
        noPoseMs: 0,
        poorPostureDetections: 0,
        alertsTriggered: 0,
        issueCounts: {
            headTilted: 0,
            headOffCenter: 0,
            unevenShoulders: 0,
        },
    };
}

export function useSessionTracking(
    posture: PostureAnalysisResult,
    alertCount: number,
    isRunning: boolean,
    alertThresholdMs: number,
) {
    const [summary, setSummary] = useState<SessionSummary>(emptySummary());
    const [postureLog, setPostureLog] = useState<PostureLogEntry[]>([]);
    const [alertLog, setAlertLog] = useState<AlertLogEntry[]>([]);

    const sessionStartRef = useRef<number | null>(null);
    const sessionEndRef = useRef<number | null>(null);

    const currentLabelRef = useRef<PostureLabel>("no-pose");
    const currentReasonsRef = useRef<string[]>([]);
    const lastTimestampRef = useRef<number | null>(null);

    const goodMsRef = useRef(0);
    const badMsRef = useRef(0);
    const noPoseMsRef = useRef(0);

    const poorDetectionsRef = useRef(0);
    const alertCountRef = useRef(0);
    const lastAlertCountRef = useRef(0);

    const issueCountsRef = useRef({
        headTilted: 0,
        headOffCenter: 0,
        unevenShoulders: 0,
    });

    const addDuration = useCallback((label: PostureLabel, duration: number) => {
        if (duration <= 0) return;

        if (label === "good") goodMsRef.current += duration;
        if (label === "bad") badMsRef.current += duration;
        if (label === "no-pose") noPoseMsRef.current += duration;
    }, []);

    const buildSummary = useCallback((): SessionSummary => {
        const start = sessionStartRef.current;
        const end = sessionEndRef.current;
        const now = Date.now();

        let liveGood = goodMsRef.current;
        let liveBad = badMsRef.current;
        let liveNoPose = noPoseMsRef.current;

        if (isRunning && lastTimestampRef.current !== null) {
            const liveDuration = now - lastTimestampRef.current;

            if (currentLabelRef.current === "good") liveGood += liveDuration;
            if (currentLabelRef.current === "bad") liveBad += liveDuration;
            if (currentLabelRef.current === "no-pose") liveNoPose += liveDuration;
        }

        return {
            sessionStart: start,
            sessionEnd: end,
            sessionDurationMs: start ? (end ?? now) - start : 0,
            goodPostureMs: liveGood,
            badPostureMs: liveBad,
            noPoseMs: liveNoPose,
            poorPostureDetections: poorDetectionsRef.current,
            alertsTriggered: alertCountRef.current,
            issueCounts: issueCountsRef.current,
        };
    }, [isRunning]);

    useEffect(() => {
        if (!isRunning) return;

        const now = Date.now();

        sessionStartRef.current = now;
        sessionEndRef.current = null;
        currentLabelRef.current = posture.label;
        currentReasonsRef.current = posture.reasons;
        lastTimestampRef.current = now;

        goodMsRef.current = 0;
        badMsRef.current = 0;
        noPoseMsRef.current = 0;

        poorDetectionsRef.current = 0;
        alertCountRef.current = 0;
        lastAlertCountRef.current = alertCount;

        issueCountsRef.current = {
            headTilted: 0,
            headOffCenter: 0,
            unevenShoulders: 0,
        };

        setPostureLog([
            {
                timestamp: now,
                label: posture.label,
                reasons: posture.reasons,
            },
        ]);

        setAlertLog([]);
        setSummary(buildSummary());
        // only start/reset when monitoring starts
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRunning]);

    useEffect(() => {
        if (!isRunning || sessionStartRef.current === null) return;

        const now = Date.now();
        const previousLabel = currentLabelRef.current;

        if (previousLabel === posture.label) {
            currentReasonsRef.current = posture.reasons;
            return;
        }

        if (lastTimestampRef.current !== null) {
            addDuration(previousLabel, now - lastTimestampRef.current);
        }

        currentLabelRef.current = posture.label;
        currentReasonsRef.current = posture.reasons;
        lastTimestampRef.current = now;

        if (posture.label === "bad") {
            poorDetectionsRef.current += 1;

            if (posture.reasons.includes("Head tilted")) {
                issueCountsRef.current.headTilted += 1;
            }

            if (posture.reasons.includes("Head off-center")) {
                issueCountsRef.current.headOffCenter += 1;
            }

            if (posture.reasons.includes("Uneven shoulders")) {
                issueCountsRef.current.unevenShoulders += 1;
            }
        }

        setPostureLog((prev) => [
            ...prev,
            {
                timestamp: now,
                label: posture.label,
                reasons: posture.reasons,
            },
        ]);

        setSummary(buildSummary());
    }, [posture.label, posture.reasons, isRunning, addDuration, buildSummary]);

    useEffect(() => {
        if (!isRunning || sessionStartRef.current === null) return;

        if (alertCount > lastAlertCountRef.current) {
            lastAlertCountRef.current = alertCount;
            alertCountRef.current += 1;

            setAlertLog((prev) => [
                ...prev,
                {
                    timestamp: Date.now(),
                },
            ]);

            setSummary(buildSummary());
        }
    }, [alertCount, isRunning, buildSummary]);

    useEffect(() => {
        if (isRunning) return;
        if (sessionStartRef.current === null) return;
        if (sessionEndRef.current !== null) return;

        const now = Date.now();

        if (lastTimestampRef.current !== null) {
            addDuration(currentLabelRef.current, now - lastTimestampRef.current);
        }

        sessionEndRef.current = now;
        lastTimestampRef.current = null;

        setSummary(buildSummary());
    }, [isRunning, addDuration, buildSummary]);

    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            setSummary(buildSummary());
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [isRunning, buildSummary]);

    const exportSession = useCallback(() => {
        const exportData = {
            metadata: {
                sessionStart: sessionStartRef.current
                    ? new Date(sessionStartRef.current).toISOString()
                    : null,
                sessionEnd: sessionEndRef.current
                    ? new Date(sessionEndRef.current).toISOString()
                    : null,
                exportedAt: new Date().toISOString(),
                alertThresholdMs,
            },
            summary: buildSummary(),
            postureLog: postureLog.map((entry) => ({
                ...entry,
                time: new Date(entry.timestamp).toISOString(),
            })),
            alertLog: alertLog.map((entry) => ({
                ...entry,
                time: new Date(entry.timestamp).toISOString(),
            })),
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `posture-session-${Date.now()}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }, [alertThresholdMs, buildSummary, postureLog, alertLog]);

    return {
        postureLog,
        alertLog,
        summary,
        exportSession,
    };
}