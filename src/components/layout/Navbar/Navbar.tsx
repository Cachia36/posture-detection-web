"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { NAV_LINKS } from "./NavLinks";
import { DesktopNavbar } from "./DesktopNavbar";

export default function Navbar() {
  const { toggleTheme, effectiveTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted ? effectiveTheme === "dark" : false;

  return (
    <nav className="bg-background/80 border-border supports-backdrop-filter:bg-background/60 sticky top-0 z-50 h-16 w-full border-b px-4 backdrop-blur">
      <DesktopNavbar
        navLinks={NAV_LINKS}
        isDark={isDark}
        toggleTheme={toggleTheme}
        currentPath={pathname ?? "/"}
      />
    </nav>
  );
}
