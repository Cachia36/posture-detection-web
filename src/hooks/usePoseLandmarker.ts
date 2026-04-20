"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    FilesetResolver,
    PoseLandmarker,
    type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

type UsePoseLandmarkerReturn = {
    isReady: boolean;
    result: PoseLandmarkerResult | null;
    error: string | null;
    startDetection: (video: HTMLVideoElement) => Promise<void>;
    stopDetection: () => void;
};

export function usePoseLandmarker(): UsePoseLandmarkerReturn {
    const landmarkerRef = useRef<PoseLandmarker | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastVideoTimeRef = useRef(-1);

    const [isReady, setIsReady] = useState(false);
    const [result, setResult] = useState<PoseLandmarkerResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const init = useCallback(async () => {
        try {
            if (landmarkerRef.current) return;

            setError(null);

            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
            );

            landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "/models/pose_landmarker_lite.task",
                },
                runningMode: "VIDEO",
                numPoses: 1,
            });

            setIsReady(true);
        } catch (err) {
            console.error(err);
            setIsReady(false);
            setError("Failed to initialize pose detection.");
        }
    }, []);

    const detectFrame = useCallback((video: HTMLVideoElement) => {
        if (!landmarkerRef.current) return;

        if (video.readyState < 2) {
            animationFrameRef.current = requestAnimationFrame(() =>
                detectFrame(video)
            );
            return;
        }

        if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;

            const nowInMs = performance.now();
            const detection = landmarkerRef.current.detectForVideo(video, nowInMs);
            setResult(detection);
        }

        animationFrameRef.current = requestAnimationFrame(() =>
            detectFrame(video)
        );
    }, []);

    const startDetection = useCallback(
        async (video: HTMLVideoElement) => {
            await init();

            if (!landmarkerRef.current) return;

            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            detectFrame(video);
        },
        [detectFrame, init]
    );

    const stopDetection = useCallback(() => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        lastVideoTimeRef.current = -1;
    }, []);

    useEffect(() => {
        return () => {
            stopDetection();
            landmarkerRef.current?.close();
            landmarkerRef.current = null;
        };
    }, [stopDetection]);

    return { isReady, result, error, startDetection, stopDetection };
}