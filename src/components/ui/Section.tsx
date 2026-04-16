import { cn } from "@/lib/core/utils";
import type { ReactNode } from "react";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  mt?: "none" | "lg";
};

export function Section({ id, children, className, mt = "lg" }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(mt === "lg" && "mt-26", "mx-auto max-w-2xl space-y-4", className)}
    >
      {children}
    </section>
  );
}
