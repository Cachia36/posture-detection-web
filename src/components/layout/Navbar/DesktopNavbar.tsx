"use client";

import Link from "next/link";
import { cn } from "@/lib/core/utils";
import { ThemeToggle } from "../../ui/ThemeToggle";
import type { NavLink } from "./NavLinks";
import { Button } from "@/components/ui/Button";

type DesktopNavbarProps = {
  navLinks: NavLink[];
  isDark: boolean;
  toggleTheme: () => void;
  authLoading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  onLogout: () => void;
  currentPath: string;
};

export function DesktopNavbar({ navLinks, isDark, toggleTheme, currentPath }: DesktopNavbarProps) {
  const isRouteActive = (href: string) => {
    if (href.startsWith("#")) return false; // anchors handled by page, not route
    if (href === "/") return currentPath === "/";
    return currentPath.startsWith(href);
  };

  return (
    <div className="hidden h-full items-center justify-between gap-6 md:flex">
      {/* Logo / brand */}
      <div className="w-8" />

      {/* Center nav links */}
      <nav className="flex items-center gap-6 text-sm font-medium">
        {navLinks.map((link) => {
          const active = isRouteActive(link.href);

          return (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className={cn(
                "text-muted-foreground relative text-sm font-medium transition-colors",
                "after:bg-foreground after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:transition-all after:duration-300",
                "hover:text-foreground hover:after:w-full",
                active && "text-foreground after:w-full",
              )}
            >
              {link.label}
            </Link>
          );
        })}
        <Link href="/posture-monitoring">
          <Button>Start Monitoring</Button>
        </Link>
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </div>
    </div>
  );
}
