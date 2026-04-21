import { useEffect } from "react";
import {
    DrawingUtils,
    PoseLandmarker,
    type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

export function usePoseOverlay(
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    videoRef: React.RefObject<HTMLVideoElement | null>,
    result: PoseLandmarkerResult | null,
) {
    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;

        if (!canvas || !video) return;

        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!width || !height) return;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        const pose = result?.landmarks?.[0];
        if (!pose) return;

        const drawingUtils = new DrawingUtils(ctx);

        drawingUtils.drawConnectors(pose, PoseLandmarker.POSE_CONNECTIONS, {
            lineWidth: 3,
        });

        drawingUtils.drawLandmarks(pose, {
            radius: 4,
            lineWidth: 2,
        });
    }, [canvasRef, videoRef, result]);
}