"use client";

import { useEffect } from "react";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { useWebcam } from "@/hooks/useWebcam";
import { PageShell } from "@/components/layout/PageShell";
import { usePoseLandmarker } from "@/hooks/usePoseLandmarker";
import { usePostureAnalysis } from "@/hooks/usePostureAnalysis";

export default function PosturePage() {
  const { videoRef, isRunning, error, startCamera, stopCamera } = useWebcam();
  const { isReady, result, error: poseError, startDetection, stopDetection } = usePoseLandmarker();
  const posture = usePostureAnalysis(result);

  useEffect(() => {
    if (!isRunning || !videoRef.current) return;
    startDetection(videoRef.current);

    return () => {
      stopDetection();
    };
  }, [isRunning, startDetection, stopDetection, videoRef]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopDetection();
    };
  }, [stopCamera, stopDetection]);

  return (
    <>
      <PageShell>
        <Section className="">
          <div className="bg-muted border-border relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-xl border">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {!isRunning && (
              <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
                Webcam preview will appear here
              </div>
            )}
          </div>

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
          {poseError && <p className="mt-2 text-sm text-red-500">{poseError}</p>}

          <div className="mt-4 space-y-1 text-sm">
            <p>Pose mode: {isReady ? "Ready" : "Loading..."}</p>
            <p>Landmarks detected: {result?.landmarks?.[0]?.length ?? 0}</p>

            {posture && (
              <>
                <p>Shoulder tilt: {(posture.shoulderTilt ?? 0).toFixed(3)}</p>
                <p>Head tilt: {(posture.headTilt ?? 0).toFixed(5)}</p>
                <p>Head side offset: {(posture.headSideOffset ?? 0).toFixed(3)}</p>

                <p>Shoulders uneven: {posture.isShoulderTilted ? "Yes" : "No"}</p>
                <p>Head tilted: {posture.isHeadTilted ? "Yes" : "No"}</p>
                <p>Head off-center: {posture.isHeadOffCenter ? "Yes" : "No"}</p>

                <p className={posture.badPosture ? "text-red-500" : "text-green-500"}>
                  Posture: {posture.badPosture ? "Bad posture" : "Good posture"}
                </p>
              </>
            )}
          </div>

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
                onClick={() => {
                  stopDetection();
                  stopCamera();
                }}
                className="rounded-full border px-6 py-3 text-sm font-medium"
              >
                Stop Monitoring
              </Button>
            )}
          </div>
        </Section>
      </PageShell>
    </>
  );
}
