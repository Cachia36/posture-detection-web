import Navbar from "./Navbar/Navbar";

type PageShellProps = {
  children: React.ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
