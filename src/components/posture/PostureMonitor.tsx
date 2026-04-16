"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/ui/Section";
import { Button } from "../ui/Button";

export function PostureMonitor() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCamera() {
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
        await videoRef.current.play();
      }

      setIsRunning(true);
    } catch {
      setError("Unable to access webcam. Please allow camera permissions.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsRunning(false);
  }

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <>
      <Section>
        <h2 className="text-xl font-semibold">Before You Start</h2>

        <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5 text-sm">
          <li>Ensure your webcam is positioned in front of you.</li>
          <li>Sit normally at your desk.</li>
          <li>Make sure your upper body is visible.</li>
          <li>Check that lighting is sufficient.</li>
        </ul>
      </Section>

      <Section>
        <div className="bg-muted border-border relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-xl border">
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

          {!isRunning && (
            <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
              Webcam preview will appear here
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        <div className="flex justify-center gap-3 pt-6">
          {!isRunning ? (
            <Button
              onClick={startCamera}
              className="bg-foreground text-background rounded-full px-6 py-3 text-sm font-medium shadow"
            >
              Start Monitoring
            </Button>
          ) : (
            <Button
              onClick={stopCamera}
              className="rounded-full border px-6 py-3 text-sm font-medium"
            >
              Stop Monitoring
            </Button>
          )}
        </div>
      </Section>
    </>
  );
}
