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
import { useStablePosture } from "@/hooks/useStablePosture";

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { videoRef, isRunning, error, startCamera, stopCamera } = useWebcam();

  const { isReady, result, error: poseError, startDetection, stopDetection } = usePoseLandmarker();

  const rawPosture = usePostureAnalysis(result);
  const posture = useStablePosture(rawPosture, 700);

  useEffect(() => {
    const video = videoRef.current;
    if (!isRunning || !video) return;

    const handlePlaying = () => {
      void startDetection(video);
    };

    if (video.readyState >= 2 && !video.paused) {
      void startDetection(video);
    } else {
      video.addEventListener("playing", handlePlaying);
    }

    return () => {
      video.removeEventListener("playing", handlePlaying);
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
      <Section className="max-w-7xl">
        <h1 className="mb-6 text-center text-3xl font-semibold">Real-Time Posture Monitoring</h1>
        <div className="grid gap-6 lg:grid-cols-[3fr_1fr]">
          <div>
            <div className="bg-muted border-border relative aspect-video min-h-[420px] overflow-hidden rounded-xl border">
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
                <div className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
                  {posture.label === "good" ? "Good posture" : "Bad posture detected"}
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
                <div className="text-muted-foreground mt-3 space-y-1">
                  <p>Shoulder tilt: {posture.metrics.shoulderTilt.toFixed(3)}</p>
                  <p>Head tilt: {posture.metrics.headTilt.toFixed(3)}</p>
                  <p>Head side offset: {posture.metrics.headSideOffset.toFixed(3)}</p>
                </div>
              )}
            </div>
            <div className="rounded-xl border p-4 text-sm">
              <h3 className="mb-2 font-semibold">How to Use</h3>
              <ul className="text-muted-foreground space-y-1">
                <li>
                  1. Click <strong>Start Monitoring</strong>.
                </li>
                <li>2. Sit naturally facing the camera.</li>
                <li>3. Ensure your head and shoulders are visible.</li>
                <li>4. The system will analyse posture in real time.</li>
                <li>5. If poor posture is detected, suggestions will appear.</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <div className="border-border/60 mt-26 mb-5 w-full border-b" />

      <Section>
        <h2 className="text-center text-2xl font-semibold">About the Project</h2>
        <p className="text-muted-foreground text-center text-sm leading-relaxed sm:text-base">
          This project presents a browser-based posture monitoring system that uses computer vision
          to analyse sitting posture in real time through a standard webcam. The system was
          developed as part of an undergraduate dissertation in Software Development and
          investigates whether accessible, browser-based tools can help increase awareness of
          everyday sitting posture.
        </p>
      </Section>

      <Section>
        <h2 className="text-center text-2xl font-semibold">About the Study</h2>
        <p className="text-muted-foreground text-center text-sm leading-relaxed sm:text-base">
          The study evaluates the feasibility and usability of real-time posture detection delivered
          directly through a web application. It explores how reliably posture can be analysed using
          webcam-based body landmark detection and how users respond to real-time visual feedback
          about their sitting posture.
        </p>
      </Section>

      <div className="border-border/60 mt-26 mb-5 w-full border-b" />

      <Section className="grid gap-8 md:grid-cols-3">
        <FeatureCard title="Webcam-Based Input">
          The application uses a webcam feed directly in the browser to observe posture during
          sitting.
        </FeatureCard>

        <FeatureCard title="Real-Time Analysis">
          Computer vision techniques are used to estimate body positioning and identify posture
          patterns while the user is seated.
        </FeatureCard>

        <FeatureCard title="Immediate Feedback">
          The system is designed to provide real-time posture insights that can improve awareness
          and support better ergonomic behaviour.
        </FeatureCard>
      </Section>

      <div className="border-border/60 mt-26 mb-5 w-full border-b" />

      <Section>
        <h2 className="text-center text-2xl font-semibold">Why Participation Matters</h2>
        <p className="text-muted-foreground text-center text-sm leading-relaxed sm:text-base">
          Participation helps support academic research into practical and accessible ergonomic
          tools. Your involvement contributes to evaluating whether browser-based posture detection
          can be useful, user-friendly, and effective in real-world settings.
        </p>
      </Section>

      <Section>
        <h2 className="text-center text-2xl font-semibold">Privacy and Ethics</h2>
        <p className="text-muted-foreground text-center text-sm leading-relaxed sm:text-base">
          This project is intended for academic research purposes. Participants should be clearly
          informed about how webcam data is handled, whether any information is stored, and how
          privacy and consent are addressed throughout the study.
        </p>

        <div className="mb-26 pt-4 text-center">
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
