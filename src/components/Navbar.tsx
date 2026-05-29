"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import type { PublicNavLink } from "@/config/public-nav";

type NavbarProps = {
  links: PublicNavLink[];
};

export function Navbar({ links }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md transition-all shadow-sm">
      <div className="container mx-auto flex h-14 sm:h-16 md:h-20 items-center justify-between gap-2 px-3 sm:px-4 md:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <div className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity shrink-0">
            <div className="relative h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 overflow-hidden">
              <Image
                src="https://i.postimg.cc/zGGW7CSV/EM.png"
                alt="Aumônerie de Cotonou"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 overflow-hidden">
              <Image
                src="https://i.postimg.cc/BnnDpTc2/CDLJ.png"
                alt="Logo CDLJ"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          <div className="hidden xl:flex flex-col justify-center min-w-0">
            <span className="text-sm font-medium text-slate-700 leading-snug truncate">
              Aumônerie de l&apos;Enfance Missionnaire de Cotonou
            </span>
            <span className="text-base font-bold text-amber-900 leading-snug truncate">
              Communauté Diocésaine des Lecteurs Juniors (CDLJ)
            </span>
          </div>
        </Link>

        {/* Navigation desktop / tablette */}
        <div className="hidden md:flex gap-3 lg:gap-6 xl:gap-8 items-center text-xs lg:text-sm font-medium text-slate-600 shrink-0">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-amber-900 transition-colors whitespace-nowrap"
            >
              <span className="lg:hidden">{link.shortLabel ?? link.label}</span>
              <span className="hidden lg:inline">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
          <Link href="/auth/login">
            <Button className="bg-amber-900 hover:bg-amber-800 text-white rounded-full px-3 sm:px-4 md:px-6 h-9 sm:h-10 text-xs sm:text-sm shadow-md hover:shadow-lg transition-all">
              <span className="hidden sm:inline">Espace Membre</span>
              <span className="sm:hidden">Membre</span>
            </Button>
          </Link>

          <button
            className="md:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-slate-600 hover:bg-amber-50 hover:text-amber-900 transition-colors"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          menuOpen ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-slate-100 bg-white/95 backdrop-blur-md px-3 sm:px-4 py-2 max-h-[70vh] overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center py-3 px-3 sm:px-4 text-sm font-medium text-slate-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
