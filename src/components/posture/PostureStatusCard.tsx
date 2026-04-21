import type { PostureAnalysisResult } from "@/hooks/usePostureAnalysis";

type Props = {
  posture: PostureAnalysisResult;
};

export function PostureStatusCard({ posture }: Props) {
  if (posture.label === "no-pose") {
    return (
      <div className="rounded-xl border p-4">
        <h2 className="text-muted-foreground text-lg font-semibold">No person detected</h2>
        <p className="text-muted-foreground text-sm">
          Sit in front of the camera so your upper body is visible.
        </p>
      </div>
    );
  }

  if (posture.label === "good") {
    return (
      <div className="rounded-xl border border-green-500 p-4">
        <h2 className="text-lg font-semibold text-green-600">Good posture</h2>
        <p className="text-sm text-green-600">Head and shoulders look aligned.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-500 p-4">
      <h2 className="text-lg font-semibold text-red-600">Bad posture detected</h2>

      <ul className="mt-2 space-y-1 text-sm text-red-600">
        {posture.reasons.map((reason) => (
          <li key={reason}>• {reason}</li>
        ))}
      </ul>
    </div>
  );
}
