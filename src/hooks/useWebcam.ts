"use client";

import { useCallback, useRef, useState } from "react";

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await new Promise<void>((resolve) => {
          const video = videoRef.current!;
          const onLoadedMetadata = () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            resolve();
          };

          if (video.readyState >= 1) {
            resolve();
          } else {
            video.addEventListener("loadedmetadata", onLoadedMetadata);
          }
        });

        await videoRef.current.play();
      }

      setIsRunning(true);
    } catch {
      setError("Unable to access webcam. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsRunning(false);
  }, []);

  return {
    videoRef,
    isRunning,
    error,
    startCamera,
    stopCamera,
  };
}
