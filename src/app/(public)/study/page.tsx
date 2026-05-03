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
        <h2 className="text-2xl font-semibold">About the Project</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          This project presents a browser-based posture monitoring system that uses computer vision
          to analyse sitting posture in real time through a standard webcam. The system was
          developed as part of an undergraduate dissertation in Software Development and explores
          whether accessible browser-based tools can support ergonomic awareness during desk work.
        </p>
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold">Purpose of the Study</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          This study investigates whether webcam-based posture monitoring can be implemented
          effectively in a browser environment. The research evaluates both the technical
          feasibility of the approach and how users interact with the posture feedback provided by
          the system.
        </p>
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold">What Participation Involves</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          Participants use the application through their browser while sitting normally in front of
          their computer. The system analyses upper-body posture in real time using the webcam and
          provides feedback when poor posture is sustained.
        </p>
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold">Session Requirement</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          A valid study session requires at least 60 minutes of monitoring. Short breaks are
          allowed, but if no person is detected for 10 continuous minutes, the session automatically
          ends and must be restarted.
        </p>
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold">Why Participation Is Valuable</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          Your participation helps evaluate whether browser-based posture detection systems are
          usable, understandable, and technically reliable in everyday environments. The feedback
          gathered contributes to understanding how such systems may support ergonomic awareness.
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