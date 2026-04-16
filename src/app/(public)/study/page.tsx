import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "About the Study",
  description:
    "Information about the posture detection study, its purpose, and participant involvement.",
};

export default function StudyPage() {
  return (
    <PageShell>
      <Section mt="lg">
        <PageHeader
          eyebrow="Study"
          title="About the Study"
          subtitle="Information about the purpose of the study and what participation involves."
        />
      </Section>

      <div className="border-border/60 mt-26 mb-5 w-full border-b" />

      <Section>
        <h2 className="text-2xl font-semibold">Purpose of the Study</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          This study evaluates the feasibility and usefulness of a webcam-based posture detection
          system. It explores whether real-time posture analysis can be delivered effectively
          through a browser and whether users find such a system practical and meaningful.
        </p>
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold">What Participation Involves</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          Participants use the system through their browser and allow webcam-based posture analysis
          during the session. The goal is to observe how the application performs and how users
          respond to the posture-related feedback it provides.
        </p>
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold">Why Participation Is Valuable</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          Your participation contributes to academic research into practical ergonomic tools. It
          helps assess the system&apos;s usability, technical reliability, and potential usefulness
          in real-world desk-based environments.
        </p>
      </Section>

      <Section className="mb-8">
        <div className="border-border/60 mb-5 w-full border-b" />

        <h2 className="text-2xl font-semibold">Important Note</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          Participation should always be based on clear information about how the system works, what
          data is used, and how privacy is handled. Please review the privacy information before
          taking part.
        </p>
      </Section>
    </PageShell>
  );
}
