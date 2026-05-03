"use client";

import { useSessionTracking } from "@/hooks/useSessionTracking";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/layout/PageShell";
import { Section } from "@/components/ui/Section";
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
  const noPersonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pipMessage, setPipMessage] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<PostureBaseline | null>(null);
  const [calibrationMessage, setCalibrationMessage] = useState<string | null>(null);
  const [calibrationStatus, setCalibrationStatus] = useState<"idle" | "success" | "error" | "info">(
    "idle",
  );
  const [noPersonMessage, setNoPersonMessage] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(false);

  const { videoRef, isRunning, error, startCamera, stopCamera } = useWebcam();

  const { isReady, result, error: poseError, startDetection, stopDetection } = usePoseLandmarker();

  const rawPosture = usePostureAnalysis(result, baseline);
  const posture = useStablePosture(rawPosture, 700);
  const ALERT_THRESHOLD_MS = 30000; // 30 Seconds
  const ALERT_REPEAT_MS = 25000; // 25 Seconds (alerts will repeat every 25 seconds if bad posture continues, ensuring at least some time to correct before next alert)
  const NO_PERSON_TIMEOUT_MS = 10 * 60 * 1000; // 10 Minutes
  const SESSION_TARGET_MS = 60 * 60 * 1000; // 60 Minutes
  const { showAlert, alertCount, dismissAlert } = useBadPostureAlert(
    posture,
    ALERT_THRESHOLD_MS,
    ALERT_REPEAT_MS,
  );
  const { permission, requestPermission, showNotification } = useBrowserNotification();
  const { summary, exportSession } = useSessionTracking(
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
      if (noPersonTimeoutRef.current) {
        clearTimeout(noPersonTimeoutRef.current);
        noPersonTimeoutRef.current = null;
      }

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
        "Session ended because the pop-out monitor was closed. A valid study session requires 60 minutes, so you may need to start a new session.",
      );
    };

    document.addEventListener("leavepictureinpicture", handleLeavePiP);

    return () => {
      document.removeEventListener("leavepictureinpicture", handleLeavePiP);
    };
  }, [isMonitoring, stopCamera, stopDetection]);
  useEffect(() => {
    if (!isMonitoring) {
      if (noPersonTimeoutRef.current) {
        clearTimeout(noPersonTimeoutRef.current);
        noPersonTimeoutRef.current = null;
      }

      setNoPersonMessage(null);
      return;
    }

    if (posture.label === "no-pose") {
      setNoPersonMessage(
        "No person detected. Monitoring will stop if no person is detected for 10 minutes.",
      );

      if (!noPersonTimeoutRef.current) {
        noPersonTimeoutRef.current = setTimeout(() => {
          dismissAlert();
          setIsMonitoring(false);
          stopDetection();
          stopCamera();

          if (document.pictureInPictureElement && document.exitPictureInPicture) {
            ignoreNextPiPLeaveRef.current = true;
            void document.exitPictureInPicture();
          }

          setNoPersonMessage(null);
          setPipMessage(
            "Session ended because no person was detected for 10 continuous minutes. A valid study session requires 60 minutes, so you may need to start a new session.",
          );

          noPersonTimeoutRef.current = null;
        }, NO_PERSON_TIMEOUT_MS);
      }

      return;
    }

    if (noPersonTimeoutRef.current) {
      clearTimeout(noPersonTimeoutRef.current);
      noPersonTimeoutRef.current = null;
    }

    setNoPersonMessage(null);
  }, [
    isMonitoring,
    posture.label,
    NO_PERSON_TIMEOUT_MS,
    dismissAlert,
    stopCamera,
    stopDetection,
  ]);
  const openPictureInPicture = async () => {
    const video = videoRef.current;

    if (!document.pictureInPictureEnabled) {
      setPipMessage("Picture-in-Picture is disabled or not supported in this browser.");
      return false;
    }

    if (!video?.requestPictureInPicture) {
      setPipMessage("Picture-in-Picture is not supported for this video.");
      return false;
    }

    if (video.readyState < 2) {
      setPipMessage("Camera preview is still loading. Wait a moment and try again.");
      return false;
    }

    try {
      if (document.pictureInPictureElement === video) {
        setPipMessage(null);
        return true;
      }

      await video.requestPictureInPicture();

      setPipMessage(null);
      return true;
    } catch (err) {
      console.error("Picture-in-Picture failed:", err);

      setPipMessage(
        "Unable to open the pop-out monitor. Use Chrome or Edge, make sure the camera preview is visible, then click Start Session again.",
      );

      return false;
    }
  };

  const startMonitoring = async () => {
    setPipMessage(null);

    if (!baseline) {
      setCalibrationStatus("info");
      setCalibrationMessage("Please calibrate your posture before starting.");
      return;
    }

    if (!isReady) {
      setPipMessage("Pose detection is still loading. Please try again in a moment.");
      return;
    }

    if (permission === "default") {
      await requestPermission();
    }

    if (!isRunning || !videoRef.current?.srcObject) {
      await startCamera();
    }

    const video = videoRef.current;

    if (!video) {
      setPipMessage("Camera is not ready. Please try again.");
      return;
    }

    // Give the video a moment to attach/play after restarting camera
    if (video.readyState < 2) {
      await new Promise<void>((resolve) => {
        const handleCanPlay = () => {
          video.removeEventListener("canplay", handleCanPlay);
          resolve();
        };

        video.addEventListener("canplay", handleCanPlay);

        // fallback so the app does not hang forever
        setTimeout(resolve, 1000);
      });
    }

    if (video.paused) {
      await video.play();
    }

    const didOpenPiP = await openPictureInPicture();
    if (!didOpenPiP) return;

    setCalibrationMessage(null);
    setCalibrationStatus("idle");

    setShowCameraPreview(false);
    setIsMonitoring(true);
    await startDetection(video);
  };

  const stopMonitoring = () => {
    if (summary.sessionDurationMs < SESSION_TARGET_MS) {
      const confirmed = window.confirm(
        "This session has not reached 60 minutes yet. Ending now may make the session incomplete. Do you still want to end the session?",
      );

      if (!confirmed) return;
    }

    dismissAlert();
    setIsMonitoring(false);
    stopDetection();
    stopCamera();

    if (document.pictureInPictureElement && document.exitPictureInPicture) {
      ignoreNextPiPLeaveRef.current = true;
      void document.exitPictureInPicture();
    }

    if (summary.sessionDurationMs >= SESSION_TARGET_MS) {
      setPipMessage("Session ended successfully. You may now export the session data.");
    } else {
      setPipMessage(
        "Session ended early. This session may be incomplete because it did not reach 60 minutes.",
      );
    }
  };

  const calibratePosture = async () => {
    setCalibrationMessage(null);
    setCalibrationStatus("idle");
    setPipMessage(null);
    setShowCameraPreview(true);

    if (!isReady) {
      setCalibrationStatus("info");
      setCalibrationMessage("Pose detection is still loading. Please try again in a moment.");
      return;
    }

    setIsCalibrating(true);

    if (!isRunning) {
      await startCamera();
    }

    const video = videoRef.current;

    if (!video) {
      setIsCalibrating(false);
      setCalibrationStatus("error");
      setCalibrationMessage("Camera is not ready. Please try again.");
      return;
    }

    await startDetection(video);

    setCalibrationStatus("info");
    setCalibrationMessage("Sit upright and hold still for 3 seconds...");

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
        setShowCameraPreview(false);
        setCalibrationStatus("error");
        setCalibrationMessage(
          baseline
            ? "Recalibration failed. Your last successful calibration is still active."
            : "Calibration failed. Make sure your head and shoulders are visible.",
        );
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

      setBaseline({
        shoulderTilt: avg.shoulderTilt / samples.length,
        headTilt: avg.headTilt / samples.length,
        headSideOffset: avg.headSideOffset / samples.length,
      });

      setShowCameraPreview(false);

      setCalibrationStatus("success");
      setCalibrationMessage("Calibration complete. You can now start the session.");
    }, 3000);
  };

  return (
    <PageShell>
      <Section className="max-w-3xl text-center">
        <h1 className="text-3xl font-semibold">Posture Monitor</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Monitor your posture while working using a pop-out window.
        </p>

        <div className="mt-6 rounded-2xl border border-yellow-500/60 bg-yellow-500/10 p-5 text-left">
          <h2 className="font-semibold text-yellow-700">Session requirement</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            This study requires a continuous session of at least <strong>60 minutes</strong>.
            Short breaks are allowed, but if no person is detected for 10 continuous minutes,
            the session will automatically end and must be restarted.
          </p>
        </div>

        <div
          className={
            showCameraPreview && !isMonitoring
              ? "mt-6 aspect-video w-full overflow-hidden rounded-2xl border"
              : "pointer-events-none fixed bottom-4 right-4 aspect-video w-[320px] overflow-hidden opacity-0"
          }
        >
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
            autoPlay
          />

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* INSTRUCTIONS */}
        <div className="mt-6 rounded-2xl border p-5 text-left">
          <h2 className="mb-3 font-bold">Before you start</h2>

          <ol className="text-muted-foreground list-decimal space-y-2 pl-4 text-sm">
            <li>
              Click <strong>Calibrate Posture</strong>.
            </li>
            <li>The camera preview will appear.</li>
            <li>Sit upright and hold still for a few seconds.</li>
            <li>
              When calibration completes, click <strong>Start Session</strong>.
            </li>
            <li>The pop-out monitor will open.</li>
            <li>
              <strong>Do not close the pop-out monitor.</strong> Closing it will stop the session.
            </li>
            <li>
              If no person is detected for <strong>10 minutes</strong>, the session will
              automatically end and you will need to start a new session.
            </li>
          </ol>

          <p className="mt-3 text-sm text-red-600">
            Important: closing the pop-out monitor or being away for 10 minutes will end
            the session.
          </p>
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
              Start Session
            </Button>
          )}

          {isMonitoring && !isCalibrating && (
            <Button
              onClick={stopMonitoring}
              className="rounded-full border px-8 py-4 text-base font-semibold"
            >
              End Session
            </Button>
          )}

          <Button
            onClick={exportSession}
            className="rounded-full border px-6 py-3 text-sm font-medium"
          >
            Export Session Data
          </Button>
        </div>
        {calibrationMessage && (
          <div
            className={`mt-4 rounded-xl border p-4 text-sm font-medium ${calibrationStatus === "success"
              ? "border-green-500 bg-green-500/10 text-green-600"
              : calibrationStatus === "error"
                ? "border-red-500 bg-red-500/10 text-red-600"
                : "border-border text-muted-foreground"
              }`}
          >
            {calibrationMessage}
          </div>
        )}
        {(pipMessage || error || poseError) && (
          <p className="mt-4 text-sm text-red-600">{pipMessage || error || poseError}</p>
        )}
        {noPersonMessage && (
          <p className="mt-4 rounded-xl border border-yellow-500/60 p-3 text-sm text-yellow-600">
            {noPersonMessage}
          </p>
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

        {isMonitoring && (
          <div className="mt-6 rounded-2xl border p-4 text-left">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold">Session progress</p>
              <p className="text-muted-foreground">
                {Math.min(Math.round((summary.sessionDurationMs / SESSION_TARGET_MS) * 100), 100)}%
              </p>
            </div>

            <div className="bg-muted mt-3 h-3 overflow-hidden rounded-full">
              <div
                className="bg-foreground h-full rounded-full"
                style={{
                  width: `${Math.min((summary.sessionDurationMs / SESSION_TARGET_MS) * 100, 100)}%`,
                }}
              />
            </div>

            <div className="text-muted-foreground mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <p>Target: 60 min</p>
              <p>Current: {Math.round(summary.sessionDurationMs / 60000)} min</p>
              <p>Good: {Math.round(summary.goodPostureMs / 60000)} min</p>
              <p>Bad: {Math.round(summary.badPostureMs / 60000)} min</p>
            </div>

            <p
              className={`mt-3 text-sm font-medium ${summary.sessionDurationMs >= SESSION_TARGET_MS ? "text-green-600" : "text-yellow-600"
                }`}
            >
              {summary.sessionDurationMs >= SESSION_TARGET_MS
                ? "Session requirement met."
                : "Session requirement not yet met."}
            </p>
          </div>
        )}

        {/* ALERT */}
        {showAlert && isMonitoring && (
          <div className="mt-6 rounded-xl border border-red-500 p-4">
            <p className="font-semibold text-red-600">Fix your posture</p>
            <button onClick={dismissAlert} className="text-sm underline">
              Dismiss
            </button>
          </div>
        )}
      </Section>
    </PageShell>
  );
}
