import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return <div className="container mx-auto max-w-6xl px-6">{children}</div>;
}
