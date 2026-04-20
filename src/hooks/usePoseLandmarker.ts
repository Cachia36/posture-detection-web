import { useCallback, useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  PoseLandmarker,
  DrawingUtils,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

type UsePoseLandmarkerReturn = {
  poseResult: PoseLandmarkerResult | null;
  isLoading: boolean;
  error: string | null;
  startDetection: (video: HTMLVideoElement) => Promise<void>;
  stopDetection: () => void;
  drawLandmarks: (
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    results?: PoseLandmarkerResult | null,
  ) => void;
};

export function usePoseLandmarker(): UsePoseLandmarkerReturn {
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [poseResult, setPoseResult] = useState<PoseLandmarkerResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializePoseLandmarker = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );

        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        if (!isMounted) {
          poseLandmarker.close();
          return;
        }

        landmarkerRef.current = poseLandmarker;
      } catch (err) {
        console.error("Failed to initialize PoseLandmarker:", err);
        if (isMounted) {
          setError("Failed to initialize pose detection.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initializePoseLandmarker();

    return () => {
      isMounted = false;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  const stopDetection = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const detectFrame = useCallback((video: HTMLVideoElement) => {
    if (!landmarkerRef.current) return;

    if (video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(() => {
        detectFrame(video);
      });
      return;
    }

    const nowInMs = performance.now();
    const results = landmarkerRef.current.detectForVideo(video, nowInMs);
    setPoseResult(results);

    animationFrameRef.current = requestAnimationFrame(() => {
      detectFrame(video);
    });
  }, []);

  const startDetection = useCallback(
    async (video: HTMLVideoElement) => {
      if (!landmarkerRef.current) {
        setError("Pose landmarker is not initialized yet.");
        return;
      }

      setError(null);
      stopDetection();
      detectFrame(video);
    },
    [detectFrame, stopDetection],
  );

  const drawLandmarks = useCallback(
    (canvas: HTMLCanvasElement, video: HTMLVideoElement, results?: PoseLandmarkerResult | null) => {
      const currentResults = results ?? poseResult;
      if (!currentResults) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawingUtils = new DrawingUtils(ctx);

      for (const landmarks of currentResults.landmarks ?? []) {
        drawingUtils.drawLandmarks(landmarks, {
          radius: 4,
        });

        drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS);
      }
    },
    [poseResult],
  );

  return {
    poseResult,
    isLoading,
    error,
    startDetection,
    stopDetection,
    drawLandmarks,
  };
}
