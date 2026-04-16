import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeatureCard } from "@/components/layout/FeatureCard";

export const metadata: Metadata = {
  title: "Real-Time Posture Detection Study",
  description:
    "A web-based computer vision system for sitting posture detection using a webcam, developed as part of a Bachelor's thesis in Software Development.",
};

export default function HomePage() {
  return (
    <>
      <PageShell>
        <Section
          mt="none"
          className="flex min-h-[calc(90vh-4rem)] flex-col items-center justify-center"
        >
          <PageHeader
            eyebrow="Real-Time Posture Detection"
            title="Design and Development of a Web-Based Computer Vision System for Sitting Posture Detection Using a Webcam"
            subtitle={
              <>
                <span>
                  This application is part of a Bachelor&apos;s thesis in Software Development,
                  exploring real-time posture analysis using computer vision technology.
                </span>
                <span className="text-muted-foreground/90 mt-2 block text-base">
                  By participating, you help contribute to academic research on workplace
                  ergonomics.
                </span>
              </>
            }
          />

          <div className="flex flex-wrap justify-center gap-3 pt-6">
            <Link
              href="/posture-monitoring"
              className="bg-foreground text-background inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition hover:opacity-90"
            >
              Start Monitoring
            </Link>

            <Link
              href="/study"
              className="border-border text-foreground hover:bg-muted inline-flex items-center justify-center rounded-full border bg-transparent px-4 py-2 text-sm font-medium transition"
            >
              Read About the Study
            </Link>

            <Link
              href="/about"
              className="border-border text-muted-foreground hover:bg-muted inline-flex items-center justify-center rounded-full border border-dashed px-4 py-2 text-sm font-medium transition"
            >
              Learn About the Project
            </Link>
          </div>
        </Section>

        <div className="border-border/60 mb-5 w-full border-b" />

        <Section>
          <h2 className="text-center text-2xl font-semibold">About the Project</h2>
          <p className="text-muted-foreground text-center text-sm leading-relaxed sm:text-base">
            This project presents a web-based computer vision system designed to detect sitting
            posture in real time using a webcam. It was developed as part of a Bachelor&apos;s
            thesis in Software Development and explores how browser-based technology can support
            ergonomic awareness in everyday desk environments.
          </p>
        </Section>

        <Section>
          <h2 className="text-center text-2xl font-semibold">About the Study</h2>
          <p className="text-muted-foreground text-center text-sm leading-relaxed sm:text-base">
            The study investigates the feasibility and usefulness of webcam-based posture detection.
            It aims to examine how such a system performs in practice, how users interact with it,
            and whether real-time feedback can help encourage healthier sitting habits.
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
            tools. Your involvement contributes to evaluating whether browser-based posture
            detection can be useful, user-friendly, and effective in real-world settings.
          </p>
        </Section>

        <Section>
          <h2 className="text-center text-2xl font-semibold">Privacy and Ethics</h2>
          <p className="text-muted-foreground text-center text-sm leading-relaxed sm:text-base">
            This project is intended for academic research purposes. Participants should be clearly
            informed about how webcam data is handled, whether any information is stored, and how
            privacy and consent are addressed throughout the study.
          </p>

          <div className="pt-4 text-center">
            <Link
              href="/privacy"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Read the privacy information
            </Link>
          </div>
        </Section>

        <div className="border-border/60 mt-26 mb-5 w-full border-b" />

        <Section className="mb-8 text-center">
          <h2 className="text-2xl font-semibold">Ready to Participate?</h2>
          <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
            You can explore the system and contribute to the study by trying the posture detection
            demo directly in your browser.
          </p>

          <div className="pt-4">
            <Link
              href="/#"
              className="bg-foreground text-background inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition hover:opacity-90"
            >
              Open Demo
            </Link>
          </div>
        </Section>
      </PageShell>
    </>
  );
}
