"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/core/utils";
import { useTheme } from "@/hooks/useTheme";
import { logoutRequest } from "@/lib/auth/client/authClient";
import { ThemeToggle } from "../../ui/ThemeToggle";
import { NAV_LINKS } from "./NavLinks";
import { MobileMenu } from "./MobileMenu";
import { DesktopNavbar } from "./DesktopNavbar";

type NavbarProps = {
  isLoggedIn: boolean;
  isAdmin: boolean;
};

export default function Navbar({
  isLoggedIn: initialIsLoggedIn,
  isAdmin: initialIsAdmin,
}: NavbarProps) {
  const { toggleTheme, effectiveTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const isLoggedIn = initialIsLoggedIn;
  const isAdmin = initialIsAdmin;

  const authLoading = false;

  const pathname = usePathname();

  useEffect(() => {
    // We intentionally set a mounted flag to avoid theme hydration mismatches
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted ? effectiveTheme === "dark" : false;

  const closeMenu = () => setIsOpen(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // ignore errors – we still treat user as logged out
    }

    // Hard navigation to avoid stale UI after logout
    window.location.href = "/login";
  };

  return (
    <nav className="bg-background/80 border-border supports-backdrop-filter:bg-background/60 sticky top-0 z-50 h-16 w-full border-b px-4 backdrop-blur">
      {/* MOBILE: top row */}
      <div className="flex items-center justify-between md:hidden">
        <div className="w-8" />
        <div className="flex flex-row gap-4">
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={cn(
              "border-border bg-muted/70 text-foreground relative inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-colors duration-200",
              "focus-visible:ring-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              isOpen && "bg-foreground text-background border-foreground",
            )}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            <span className="sr-only">Toggle navigation menu</span>

            {/* Top line */}
            <span
              className={cn(
                "absolute h-0.5 w-4 rounded-full bg-current transition-all duration-300",
                isOpen ? "translate-y-0 rotate-45" : "-translate-y-1.5 rotate-0",
              )}
            />

            {/* Middle line */}
            <span
              className={cn(
                "absolute h-0.5 w-4 rounded-full bg-current transition-all duration-300",
                isOpen ? "opacity-0" : "opacity-100",
              )}
            />

            {/* Bottom line */}
            <span
              className={cn(
                "absolute h-0.5 w-4 rounded-full bg-current transition-all duration-300",
                isOpen ? "translate-y-0 -rotate-45" : "translate-y-1.5 rotate-0",
              )}
            />
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <MobileMenu
        isOpen={isOpen}
        navLinks={NAV_LINKS}
        authLoading={authLoading}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onClose={closeMenu}
        onLogout={handleLogout}
        currentPath={pathname ?? "/"}
      />

      {/* DESKTOP */}
      <DesktopNavbar
        navLinks={NAV_LINKS}
        isDark={isDark}
        toggleTheme={toggleTheme}
        authLoading={authLoading}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        currentPath={pathname ?? "/"}
      />
    </nav>
  );
}
