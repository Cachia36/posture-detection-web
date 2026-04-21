import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Privacy and Ethics",
  description: "Privacy and ethical considerations for the posture detection study.",
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <Section mt="lg">
        <PageHeader
          eyebrow="Privacy"
          title="Privacy and Ethics"
          subtitle="Important information about webcam use, privacy, and responsible participation."
        />
      </Section>

      <div className="border-border/60 mt-26 mb-5 w-full border-b" />

      <Section>
        <h2 className="text-2xl font-semibold">Webcam Use</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          The application uses the device webcam to analyse body landmarks required for posture
          estimation. Video frames are processed locally in the browser in real time using computer
          vision models.
        </p>
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold">Privacy Considerations</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          No webcam video is recorded, stored, or transmitted to external servers by the
          application. All posture analysis occurs locally within the user's browser session. The
          system does not retain images, recordings, or personal video data.
        </p>
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold">Consent and Transparency</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          Participation should always be voluntary. Users should understand how the system works,
          what information is processed during use, and the limitations of the technology.
        </p>
      </Section>

      <Section className="mb-8">
        <h2 className="text-2xl font-semibold">Research Context</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          This application is developed as part of an academic dissertation in Software Development.
          The system is intended for research and demonstration purposes and should not be
          considered a medical or diagnostic tool.
        </p>
      </Section>
    </PageShell>
  );
}
