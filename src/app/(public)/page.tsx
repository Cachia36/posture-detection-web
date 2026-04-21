"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/layout/PageShell";
import { Section } from "@/components/ui/Section";
import { FeatureCard } from "@/components/layout/FeatureCard";
import { PostureStatusCard } from "@/components/posture/PostureStatusCard";
import { useWebcam } from "@/hooks/useWebcam";
import { usePoseLandmarker } from "@/hooks/usePoseLandmarker";
import { usePostureAnalysis } from "@/hooks/usePostureAnalysis";
import { usePoseOverlay } from "@/hooks/usePoseOverlay";

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { videoRef, isRunning, error, startCamera, stopCamera } = useWebcam();

  const {
    isReady,
    result,
    error: poseError,
    startDetection,
    stopDetection,
  } = usePoseLandmarker();

  const posture = usePostureAnalysis(result);

  useEffect(() => {
    if (!isRunning || !videoRef.current) return;

    void startDetection(videoRef.current);

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

  usePoseOverlay(canvasRef, videoRef, result);

  return (
    <PageShell>
      <Section className="max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="bg-muted border-border relative overflow-hidden rounded-xl border aspect-video min-h-[420px]">
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                muted
                autoPlay
              />

              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />

              {!isRunning && (
                <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
                  Webcam preview will appear here
                </div>
              )}

              {posture.label !== "no-pose" && (
                <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
                  {posture.label === "good"
                    ? "Good posture"
                    : "Bad posture detected"}
                </div>
              )}
            </div>

            {(error || poseError) && (
              <div className="mt-4 space-y-2">
                {error && <p className="text-sm text-red-500">{error}</p>}
                {poseError && <p className="text-sm text-red-500">{poseError}</p>}
              </div>
            )}

            <div className="mt-4 flex flex-wrap justify-center gap-3">
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
          </div>

          <div className="space-y-4">
            <PostureStatusCard posture={posture} />

            <div className="rounded-xl border p-4 text-sm">
              <p>Pose model: {isReady ? "Ready" : "Loading..."}</p>
              <p>Landmarks detected: {result?.landmarks?.[0]?.length ?? 0}</p>
              <p>Camera: {isRunning ? "Running" : "Stopped"}</p>

              {posture.label !== "no-pose" && posture.metrics && (
                <div className="mt-3 space-y-1 text-muted-foreground">
                  <p>Shoulder tilt: {posture.metrics.shoulderTilt.toFixed(3)}</p>
                  <p>Head tilt: {posture.metrics.headTilt.toFixed(3)}</p>
                  <p>Head side offset: {posture.metrics.headSideOffset.toFixed(3)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      <div className="border-border/60 mt-26 mb-5 w-full border-b" />

      <Section>
        <h2 className="text-center text-2xl font-semibold">About the Project</h2>
        <p className="text-muted-foreground text-center text-sm leading-relaxed sm:text-base">
          This project presents a web-based computer vision system designed to detect
          sitting posture in real time using a webcam. It was developed as part of a
          Bachelor&apos;s thesis in Software Development and explores how browser-based
          technology can support ergonomic awareness in everyday desk environments.
        </p>
      </Section>

      <Section>
        <h2 className="text-center text-2xl font-semibold">About the Study</h2>
        <p className="text-muted-foreground text-center text-sm leading-relaxed sm:text-base">
          The study investigates the feasibility and usefulness of webcam-based posture
          detection. It aims to examine how such a system performs in practice, how users
          interact with it, and whether real-time feedback can help encourage healthier
          sitting habits.
        </p>
      </Section>

      <div className="border-border/60 mt-26 mb-5 w-full border-b" />

      <Section className="grid gap-8 md:grid-cols-3">
        <FeatureCard title="Webcam-Based Input">
          The application uses a webcam feed directly in the browser to observe posture
          during sitting.
        </FeatureCard>

        <FeatureCard title="Real-Time Analysis">
          Computer vision techniques are used to estimate body positioning and identify
          posture patterns while the user is seated.
        </FeatureCard>

        <FeatureCard title="Immediate Feedback">
          The system is designed to provide real-time posture insights that can improve
          awareness and support better ergonomic behaviour.
        </FeatureCard>
      </Section>

      <div className="border-border/60 mt-26 mb-5 w-full border-b" />

      <Section>
        <h2 className="text-center text-2xl font-semibold">Why Participation Matters</h2>
        <p className="text-muted-foreground text-center text-sm leading-relaxed sm:text-base">
          Participation helps support academic research into practical and accessible
          ergonomic tools. Your involvement contributes to evaluating whether
          browser-based posture detection can be useful, user-friendly, and effective in
          real-world settings.
        </p>
      </Section>

      <Section>
        <h2 className="text-center text-2xl font-semibold">Privacy and Ethics</h2>
        <p className="text-muted-foreground text-center text-sm leading-relaxed sm:text-base">
          This project is intended for academic research purposes. Participants should be
          clearly informed about how webcam data is handled, whether any information is
          stored, and how privacy and consent are addressed throughout the study.
        </p>

        <div className="pt-4 text-center mb-26">
          <Link
            href="/privacy"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Read the privacy information
          </Link>
        </div>
      </Section>
    </PageShell>
  );
}