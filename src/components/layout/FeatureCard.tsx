import type { ReactNode } from "react";

type FeatureCardProps = {
  title: string;
  children: ReactNode;
};

export function FeatureCard({ title, children }: FeatureCardProps) {
  return (
    <div className="bg-muted/60 text-muted-foreground border-border rounded-xl border p-5 text-sm shadow-sm">
      {title && <h2 className="text-foreground mb-1 text-center text-sm font-semibold">{title}</h2>}

      <div className="text-center leading-relaxed">{children}</div>
    </div>
  );
}
