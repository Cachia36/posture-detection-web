"use client";

import { useSessionTracking } from "@/hooks/useSessionTracking";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/layout/PageShell";
import { Section } from "@/components/ui/Section";
import { FeatureCard } from "@/components/layout/FeatureCard";
import { useWebcam } from "@/hooks/useWebcam";
import { usePoseLandmarker } from "@/hooks/usePoseLandmarker";
import { usePostureAnalysis, type PostureBaseline } from "@/hooks/usePostureAnalysis";
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
    gain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + delay + 0.03);

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
  const latestMetricsRef = useRef<PostureBaseline | null>(null);
  const ignoreNextPiPLeaveRef = useRef(false);
  const [pipMessage, setPipMessage] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<PostureBaseline | null>(null);
  const [calibrationMessage, setCalibrationMessage] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const { videoRef, isRunning, error, startCamera, stopCamera } = useWebcam();

  const { isReady, result, error: poseError, startDetection, stopDetection } = usePoseLandmarker();

  const rawPosture = usePostureAnalysis(result, baseline);
  const posture = useStablePosture(rawPosture, 700);
  const ALERT_THRESHOLD_MS = 5000;
  const ALERT_REPEAT_MS = 15000;
  const { showAlert, alertCount, dismissAlert } = useBadPostureAlert(
    posture,
    ALERT_THRESHOLD_MS,
    ALERT_REPEAT_MS,
  );
  const { permission, requestPermission, showNotification } = useBrowserNotification();
  const { exportSession } = useSessionTracking(
    posture,
    alertCount,
    isMonitoring,
    ALERT_THRESHOLD_MS,
  );

  usePoseOverlay(canvasRef, videoRef, result);

  useEffect(() => {
    latestMetricsRef.current = rawPosture.metrics;
  }, [rawPosture.metrics]);

  useEffect(() => {
    const video = videoRef.current;
    if (!isRunning || (!isMonitoring && !isCalibrating) || !video) return;

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
  }, [isCalibrating, isMonitoring, isRunning, startDetection, stopDetection, videoRef]);

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
      if (ignoreNextPiPLeaveRef.current) {
        ignoreNextPiPLeaveRef.current = false;
        return;
      }

      if (!isMonitoring) return;

      setIsMonitoring(false);
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
  }, [isMonitoring, stopCamera, stopDetection]);

  const openPictureInPicture = async () => {
    const video = videoRef.current;

    if (!video?.requestPictureInPicture) {
      setPipMessage("Picture-in-Picture is not supported in this browser.");
      return false;
    }

    try {
      if (document.pictureInPictureElement === video) {
        setPipMessage(null);
        return true;
      }

      if (document.pictureInPictureElement && document.exitPictureInPicture) {
        ignoreNextPiPLeaveRef.current = true;
        await document.exitPictureInPicture();
      }

      await video.requestPictureInPicture();
      setPipMessage(null);
      return true;
    } catch (err) {
      console.error("Picture-in-Picture failed:", err);
      setPipMessage("Unable to open the pop-out monitor.");
      return false;
    }
  };

  const startMonitoring = async () => {
    setPipMessage(null);

    if (!baseline) {
      setCalibrationMessage("Please calibrate your posture before starting.");
      return;
    }

    if (!isReady) {
      setPipMessage("Pose detection is still loading. Please try again in a moment.");
      return;
    }

    const video = videoRef.current;
    if (!isRunning || !video?.srcObject) {
      setPipMessage("Camera is not ready. Please recalibrate posture, then start monitoring.");
      return;
    }

    await video.play();

    const didOpenPiP = await openPictureInPicture();
    if (!didOpenPiP) return;

    if (permission === "default") {
      await requestPermission();
    }

    setIsMonitoring(true);
    await startDetection(video);
  };

  const stopMonitoring = () => {
    dismissAlert();
    setIsMonitoring(false);
    stopDetection();
    stopCamera();

    if (document.pictureInPictureElement && document.exitPictureInPicture) {
      ignoreNextPiPLeaveRef.current = true;
      void document.exitPictureInPicture();
    }
  };
  const calibratePosture = async () => {
    setCalibrationMessage(null);
    setPipMessage(null);

    if (!isReady) {
      setCalibrationMessage("Pose detection is still loading. Please try again in a moment.");
      return;
    }

    setIsCalibrating(true);

    if (!isRunning) {
      await startCamera();
    }

    if (videoRef.current) {
      await startDetection(videoRef.current);
    }

    setCalibrationMessage("Sit upright and hold still...");

    const samples: PostureBaseline[] = [];

    const interval = setInterval(() => {
      if (latestMetricsRef.current) {
        samples.push(latestMetricsRef.current);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      stopDetection();
      setIsCalibrating(false);

      if (samples.length < 5) {
        setCalibrationMessage("Calibration failed. Make sure your head and shoulders are visible.");
        return;
      }

      const avg = samples.reduce(
        (acc, cur) => ({
          shoulderTilt: acc.shoulderTilt + cur.shoulderTilt,
          headTilt: acc.headTilt + cur.headTilt,
          headSideOffset: acc.headSideOffset + cur.headSideOffset,
        }),
        { shoulderTilt: 0, headTilt: 0, headSideOffset: 0 },
      );

      const baseline = {
        shoulderTilt: avg.shoulderTilt / samples.length,
        headTilt: avg.headTilt / samples.length,
        headSideOffset: avg.headSideOffset / samples.length,
      };

      setBaseline(baseline);

      setCalibrationMessage("Calibration complete. You can now start monitoring.");
    }, 3000);
  };

  return (
    <PageShell>
      <Section className="max-w-3xl text-center">
        <h1 className="text-3xl font-semibold">Posture Monitor</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Monitor your posture while working using a pop-out window.
        </p>

        {/* INSTRUCTIONS */}
        <div className="mt-6 rounded-2xl border p-5 text-left">
          <h2 className="mb-3 font-bold">Before you start</h2>

          <ol className="text-muted-foreground list-decimal space-y-2 pl-4 text-sm">
            <li>
              Click <strong>Calibrate Posture</strong>
            </li>
            <li>Sit upright and hold still for a few seconds</li>
            <li>
              Click <strong>Start Monitoring</strong>
            </li>
            <li>A pop-out window will appear</li>
            <li>
              <strong>Do NOT close it</strong>
            </li>
          </ol>

          <p className="mt-3 text-sm text-red-600">Closing the pop-out will stop monitoring.</p>
        </div>

        {/* BUTTONS */}
        <div className="mt-6 flex justify-center gap-4">
          <Button
            onClick={calibratePosture}
            disabled={isCalibrating || !isReady}
            className="rounded-full border px-6 py-3 text-sm font-medium"
          >
            {isCalibrating
              ? "Calibrating..."
              : !isReady
                ? "Loading Detection..."
                : baseline
                  ? "Recalibrate Posture"
                  : "Calibrate Posture"}
          </Button>

          {baseline && !isMonitoring && !isCalibrating && (
            <Button
              onClick={startMonitoring}
              disabled={!isReady}
              className="bg-foreground text-background rounded-full px-8 py-4 text-base font-semibold shadow"
            >
              Start Monitoring
            </Button>
          )}

          {isMonitoring && !isCalibrating && (
            <Button
              onClick={stopMonitoring}
              className="rounded-full border px-8 py-4 text-base font-semibold"
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
        {calibrationMessage && (
          <p className="text-muted-foreground mt-4 text-sm">{calibrationMessage}</p>
        )}
        {(pipMessage || error || poseError) && (
          <p className="mt-4 text-sm text-red-600">{pipMessage || error || poseError}</p>
        )}
        {/* STATUS */}
        {isMonitoring && !isCalibrating && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl border p-3">
              <p className="text-muted-foreground text-xs">Camera</p>
              <p className="font-semibold text-green-600">Active</p>
            </div>

            <div className="rounded-xl border p-3">
              <p className="text-muted-foreground text-xs">Person</p>
              <p className="font-semibold">{posture.label === "no-pose" ? "No" : "Yes"}</p>
            </div>

            <div className="rounded-xl border p-3">
              <p className="text-muted-foreground text-xs">Posture</p>
              <p
                className={`font-semibold ${posture.label === "good"
                  ? "text-green-600"
                  : posture.label === "bad"
                    ? "text-red-600"
                    : ""
                  }`}
              >
                {posture.label}
              </p>
            </div>
          </div>
        )}

        {/* ALERT */}
        {showAlert && (
          <div className="mt-6 rounded-xl border border-red-500 p-4">
            <p className="font-semibold text-red-600">Fix your posture</p>
            <button onClick={dismissAlert} className="text-sm underline">
              Dismiss
            </button>
          </div>
        )}

        {/* HIDDEN VIDEO (IMPORTANT) */}
        <div className="pointer-events-none fixed -left-px top-0 h-px w-px overflow-hidden opacity-0">
          <video ref={videoRef} playsInline muted autoPlay />
          <canvas ref={canvasRef} />
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
          Webcam frames are processed locally in the browser for real-time posture analysis. The
          application does not record, store, or upload webcam video. This project is intended for
          academic research and demonstration purposes and should not be considered a medical or
          diagnostic tool.
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
