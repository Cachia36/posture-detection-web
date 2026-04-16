import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "About the Project",
  description: "Learn more about the real-time posture detection project and its goals.",
};

export default function AboutPage() {
  return (
    <PageShell>
      <Section mt="lg">
        <PageHeader
          eyebrow="About"
          title="About the Project"
          subtitle="A web-based computer vision system developed as part of a Bachelor's thesis in Software Development."
        />
      </Section>

      <div className="border-border/60 mt-26 mb-5 w-full border-b" />

      <Section>
        <h2 className="text-2xl font-semibold">Project Overview</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          This project explores the design and development of a browser-based system that uses a
          webcam to detect sitting posture in real time. It combines web development and computer
          vision concepts to investigate whether accessible consumer hardware can support ergonomic
          awareness in practical settings.
        </p>
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold">Project Aim</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          The main aim of the project is to examine whether a web-based posture detection solution
          can provide meaningful real-time feedback using a standard webcam. The system is intended
          to demonstrate technical feasibility while also considering usability and accessibility.
        </p>
      </Section>

      <div className="border-border/60 mt-26 mb-5 w-full border-b" />

      <Section>
        <h2 className="text-2xl font-semibold">Technical Focus</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          The project focuses on browser-based interaction, webcam input, and posture-related
          analysis using computer vision techniques. It also considers the user experience of
          real-time feedback within a modern web application.
        </p>
      </Section>

      <Section className="mb-8">
        <h2 className="text-2xl font-semibold">Why This Matters</h2>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
          Poor sitting posture is a common issue in desk-based work and study environments. This
          project investigates whether a simple and accessible browser application could help raise
          awareness and support healthier habits without requiring specialised equipment.
        </p>
      </Section>
    </PageShell>
  );
}
