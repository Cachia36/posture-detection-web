"use client";

import { useSessionTracking } from "@/hooks/useSessionTracking";
import { useEffect, useRef, useState } from "react";
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
import { useBadPostureAlert } from "@/hooks/useBadPostureAlert";
import { useBrowserNotification } from "@/hooks/useBrowserNotification";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function playBeep() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const audioCtx = new AudioContextClass();

  const beep = (delay: number) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(650, audioCtx.currentTime + delay);

    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(
      0.05,
      audioCtx.currentTime + delay + 0.03,
    );

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + 0.15);
  };

  beep(0);
  beep(0.25);
  beep(0.5);

  setTimeout(() => {
    void audioCtx.close();
  }, 800);
}

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pipMessage, setPipMessage] = useState<string | null>(null);

  const { videoRef, isRunning, error, startCamera, stopCamera } = useWebcam();

  const {
    isReady,
    result,
    error: poseError,
    startDetection,
    stopDetection,
  } = usePoseLandmarker();

  const rawPosture = usePostureAnalysis(result);
  const posture = useStablePosture(rawPosture, 700);
  const ALERT_THRESHOLD_MS = 5000;
  const ALERT_REPEAT_MS = 15000;
  const { showAlert, alertCount, dismissAlert } = useBadPostureAlert(posture, ALERT_THRESHOLD_MS, ALERT_REPEAT_MS);
  const { permission, requestPermission, showNotification } = useBrowserNotification();
  const { summary, exportSession } = useSessionTracking(
    posture,
    alertCount,
    isRunning,
    ALERT_THRESHOLD_MS,
  );

  usePoseOverlay(canvasRef, videoRef, result);

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

  useEffect(() => {
    if (alertCount <= 0) return;

    playBeep();

    showNotification(
      "Posture needs adjustment",
      "Poor posture has been detected. Sit upright and realign your head and shoulders.",
    );
  }, [alertCount, showNotification]);

  useEffect(() => {
    const handleLeavePiP = () => {
      if (!isRunning) return;

      stopDetection();
      stopCamera();
      setPipMessage(
        "Monitoring has stopped because the pop-out monitor was closed. Restart monitoring and keep the pop-out window open.",
      );
    };

    document.addEventListener("leavepictureinpicture", handleLeavePiP);

    return () => {
      document.removeEventListener("leavepictureinpicture", handleLeavePiP);
    };
  }, [isRunning, stopCamera, stopDetection]);

  const openPictureInPicture = async () => {
    const video = videoRef.current;

    if (!video?.requestPictureInPicture) {
      setPipMessage("Picture-in-Picture is not supported in this browser.");
      return;
    }

    try {
      if (document.pictureInPictureElement && document.exitPictureInPicture) {
        await document.exitPictureInPicture();
        return;
      }

      await video.requestPictureInPicture();
      setPipMessage(null);
    } catch (err) {
      console.error("Picture-in-Picture failed:", err);
      setPipMessage("Unable to open the pop-out monitor.");
    }
  };

  const startMonitoring = async () => {
    setPipMessage(null);

    if (permission === "default") {
      await requestPermission();
    }

    await startCamera();

    setTimeout(() => {
      void openPictureInPicture();
    }, 500);
  };

  const stopMonitoring = () => {
    dismissAlert();
    stopDetection();
    stopCamera();

    if (document.pictureInPictureElement && document.exitPictureInPicture) {
      void document.exitPictureInPicture();
    }
  };

  return (
    <PageShell>
      <Section className="max-w-7xl">

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <div
              className={`bg-muted border-border relative aspect-video min-h-[420px] w-full overflow-hidden rounded-2xl border shadow-sm ${showAlert ? "animate-pulse ring-4 ring-red-500 ring-offset-2" : ""
                }`}
            >
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
                <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center text-center text-sm">
                  <p className="font-medium">Webcam preview will appear here</p>
                  <p className="mt-1 text-xs">
                    Start monitoring to enable posture detection.
                  </p>
                </div>
              )}

              {posture.label !== "no-pose" && (
                <div
                  className={`absolute top-4 left-4 rounded-full px-4 py-2 text-sm font-medium text-white shadow ${posture.label === "good" ? "bg-green-600" : "bg-red-600"
                    }`}
                >
                  {posture.label === "good" ? "Good posture" : "Bad posture detected"}
                </div>
              )}

              {showAlert && (
                <div className="bg-background absolute right-4 bottom-4 max-w-sm rounded-2xl border border-red-500 p-4 shadow-lg">
                  <p className="font-semibold text-red-600">
                    Posture needs adjustment
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    Poor posture has been detected for a while. Sit upright and
                    realign your head and shoulders.
                  </p>

                  <button
                    onClick={dismissAlert}
                    className="mt-3 text-sm font-medium text-red-600 underline-offset-4 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {(error || poseError || pipMessage) && (
              <div className="space-y-2">
                {error && <p className="text-sm text-red-500">{error}</p>}
                {poseError && <p className="text-sm text-red-500">{poseError}</p>}
                {pipMessage && (
                  <p className="rounded-xl border border-yellow-500/60 p-3 text-sm text-yellow-600">
                    {pipMessage}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
              <div>
                <p className="text-sm font-semibold">Monitoring controls</p>
                <p className="text-muted-foreground text-xs">
                  Start monitoring opens the pop-out window automatically.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {!isRunning ? (
                  <Button
                    onClick={startMonitoring}
                    className="bg-foreground text-background rounded-full px-6 py-3 text-sm font-medium shadow"
                  >
                    Start Monitoring
                  </Button>
                ) : (
                  <Button
                    onClick={stopMonitoring}
                    className="rounded-full border px-6 py-3 text-sm font-medium"
                  >
                    Stop Monitoring
                  </Button>
                )}

                <Button
                  onClick={exportSession}
                  className="rounded-full border px-6 py-3 text-sm font-medium"
                >
                  Export Data
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-red-500/70 p-4">
              <p className="text-sm font-semibold text-red-600">
                Important: keep the pop-out monitor open.
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Monitoring will stop if the pop-out window is closed. Keep it open
                while using your laptop so alerts can continue working.
              </p>
            </div>
          </div>

          <aside className="w-full min-w-0 space-y-4">
            <div className="rounded-2xl border border-red-500/70 p-4 text-sm">
              <h3 className="font-semibold text-red-600">
                Important Monitoring Notice
              </h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                This system requires the pop-out monitor to remain open. If you close
                it, posture monitoring will stop and alerts will no longer be
                triggered.
              </p>
            </div>

            <div className="rounded-2xl border p-4 text-sm">
              <h3 className="mb-2 font-semibold">How to Use</h3>
              <ol className="text-muted-foreground list-decimal space-y-1 pl-4">
                <li>
                  Click <strong>Start Monitoring</strong>.
                </li>
                <li>Allow camera and notification permissions.</li>
                <li>
                  Keep the pop-out monitor open.{" "}
                  <strong>Monitoring stops if it is closed.</strong>
                </li>
                <li>Sit naturally facing the camera.</li>
                <li>Ensure your head and shoulders are visible.</li>
                <li>Alerts appear and sound if poor posture is sustained.</li>
              </ol>
            </div>

            <PostureStatusCard posture={posture} />

            <div className="rounded-2xl border p-4 text-sm">
              <h3 className="mb-2 font-semibold">Technical Status</h3>
              <div className="text-muted-foreground space-y-1">
                <p>Pose model: {isReady ? "Ready" : "Loading..."}</p>
                <p>Landmarks detected: {result?.landmarks?.[0]?.length ?? 0}</p>
                <p>Camera: {isRunning ? "Running" : "Stopped"}</p>
              </div>

              {posture.label !== "no-pose" && posture.metrics && (
                <div className="text-muted-foreground mt-3 space-y-1 border-t pt-3">
                  <p>Shoulder tilt: {posture.metrics.shoulderTilt.toFixed(3)}</p>
                  <p>Head tilt: {posture.metrics.headTilt.toFixed(3)}</p>
                  <p>Head side offset: {posture.metrics.headSideOffset.toFixed(3)}</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border p-4 text-sm">
              <h3 className="mb-2 font-semibold">Session Summary</h3>
              <div className="text-muted-foreground space-y-1">
                <p>Total duration: {Math.round(summary.sessionDurationMs / 1000)}s</p>
                <p>Good posture: {Math.round(summary.goodPostureMs / 1000)}s</p>
                <p>Bad posture: {Math.round(summary.badPostureMs / 1000)}s</p>
                <p>Poor posture detections: {summary.poorPostureDetections}</p>
                <p>Alerts triggered: {summary.alertsTriggered}</p>
              </div>
            </div>
          </aside>
        </div>
      </Section>

      <div className="border-border/60 mt-26 mb-5 w-full border-b" />

      <Section>
        <h2 className="text-center text-2xl font-semibold">About the Project</h2>
        <p className="text-muted-foreground text-center text-sm leading-relaxed sm:text-base">
          This project presents a browser-based posture monitoring system that uses
          computer vision to analyse sitting posture in real time through a standard
          webcam. The system was developed as part of an undergraduate dissertation in
          Software Development and investigates whether accessible, browser-based tools
          can help increase awareness of everyday sitting posture.
        </p>
      </Section>

      <Section>
        <h2 className="text-center text-2xl font-semibold">About the Study</h2>
        <p className="text-muted-foreground text-center text-sm leading-relaxed sm:text-base">
          The study evaluates the feasibility and usability of real-time posture detection
          delivered directly through a web application. It explores how reliably posture can
          be analysed using webcam-based body landmark detection and how users respond to
          real-time visual feedback about their sitting posture.
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
        <h2 className="text-center text-2xl font-semibold">
          Why Participation Matters
        </h2>
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
          Webcam frames are processed locally in the browser for real-time posture
          analysis. The application does not record, store, or upload webcam video. This
          project is intended for academic research and demonstration purposes and should
          not be considered a medical or diagnostic tool.
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