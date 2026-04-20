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
  const detectFrameRef = useRef<((video: HTMLVideoElement) => void) | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [result, setResult] = useState<PoseLandmarkerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopDetection = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    detectFrameRef.current = (video: HTMLVideoElement) => {
      if (!landmarkerRef.current) return;

      if (video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(() => {
          detectFrameRef.current?.(video);
        });
        return;
      }

      const nowInMs = performance.now();
      const detectionResult = landmarkerRef.current.detectForVideo(video, nowInMs);
      setResult(detectionResult);

      animationFrameRef.current = requestAnimationFrame(() => {
        detectFrameRef.current?.(video);
      });
    };
  }, []);

  const startDetection = useCallback(
    async (video: HTMLVideoElement) => {
      if (!landmarkerRef.current) {
        setError("Pose landmarker is not ready yet.");
        return;
      }

      setError(null);
      stopDetection();
      detectFrameRef.current?.(video);
    },
    [stopDetection],
  );

  useEffect(() => {
    let isMounted = true;

    const initializePoseLandmarker = async () => {
      try {
        setError(null);
        setIsReady(false);

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
        setIsReady(true);
      } catch (err) {
        console.error("Failed to initialize PoseLandmarker:", err);
        if (isMounted) {
          setError("Failed to initialize pose detection.");
          setIsReady(false);
        }
      }
    };

    void initializePoseLandmarker();

    return () => {
      isMounted = false;
      stopDetection();

      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, [stopDetection]);

  return {
    isReady,
    result,
    error,
    startDetection,
    stopDetection,
  };
}
