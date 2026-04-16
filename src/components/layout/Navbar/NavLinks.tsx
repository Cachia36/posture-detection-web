export type NavLink = {
  href: string;
  label: string;
};

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/study", label: "Study" },
  { href: "/privacy", label: "Privacy" },
  { href: "#contact", label: "Contact" },
];
