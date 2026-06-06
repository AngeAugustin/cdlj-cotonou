export type PublicNavLink = {
  href: string;
  label: string;
  shortLabel?: string;
};

export const PUBLIC_NAV_LINKS: PublicNavLink[] = [
  { href: "/", label: "Accueil" },
  { href: "/about", label: "À Propos" },
  { href: "/nos-vicariats", label: "Vicariats" },
  { href: "/forums", label: "Forums" },
  { href: "/news", label: "Blog & Actualités", shortLabel: "Blog" },
  { href: "/mediatheque", label: "Médiathèque" },
  { href: "/resultats", label: "Résultats" },
];
