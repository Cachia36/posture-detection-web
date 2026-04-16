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
          This system uses webcam input for posture-related analysis during use of the application.
          Participants should understand how the webcam is used and whether any data is stored,
          processed temporarily, or retained for research purposes.
        </p>
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold">Privacy Considerations</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          Privacy is an important part of any system involving camera input. Participants should be
          informed about what information is collected, how it is handled, and what safeguards are
          in place to protect user data.
        </p>
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold">Consent and Transparency</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          Participation should be voluntary and based on clear information. Users should know what
          the purpose of the study is, what their involvement means, and any limits of the system.
        </p>
      </Section>

      <Section className="mb-8">
        <h2 className="text-2xl font-semibold">Research Context</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          This project is developed as part of an academic study in Software Development and should
          be understood in that context. The system is intended to support research into posture
          detection and ergonomic awareness rather than provide medical advice or diagnosis.
        </p>
      </Section>
    </PageShell>
  );
}
