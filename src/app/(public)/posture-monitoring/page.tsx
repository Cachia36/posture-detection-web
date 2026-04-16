import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/ui/Section";
import { PostureMonitor } from "@/components/posture/PostureMonitor";

export const metadata: Metadata = {
    title: "Real-Time Posture Detection Study",
    description:
        "A web-based computer vision system for sitting posture detection using a webcam, developed as part of a Bachelor's thesis in Software Development.",
};

export default function MonitorPosturePage() {
    return (
        <PageShell>
            <Section mt="lg">
                <PageHeader
                    eyebrow=""
                    title="Posture Monitoring"
                    subtitle="This page analyzes sitting posture using your webcam in real time."
                />
            </Section>

            <PostureMonitor />
        </PageShell>
    );
}
