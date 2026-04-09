"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/about", label: "À Propos" },
  { href: "/nos-vicariats", label: "Vicariats" },
  { href: "/forums", label: "Forums" },
  { href: "/news", label: "Blog & Actualités" },
  { href: "/verifier", label: "Vérifier" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md transition-all shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="flex items-center gap-4 hover:opacity-90 transition-opacity">
              <div className="relative h-20 w-20 overflow-hidden shrink-0">
                <Image
                  src="https://i.postimg.cc/zGGW7CSV/EM.png"
                  alt="Aumônerie de Cotonou"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="relative h-12 w-12 overflow-hidden shrink-0">
                <Image
                  src="https://i.postimg.cc/BnnDpTc2/CDLJ.png"
                  alt="Logo CDLJ"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>

            <div className="hidden lg:flex flex-col justify-center shrink-0">
              <span className="text-sm font-medium text-slate-700 leading-snug">
                Aumônerie de l'Enfance Missionnaire de Cotonou
              </span>
              <span className="text-base font-bold text-amber-900 leading-snug">
                Communauté Diocésaine des Lecteurs Juniors (CDLJ)
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation desktop */}
        <div className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-600">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-amber-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Droite : Espace Membre + hamburger */}
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button className="bg-amber-900 hover:bg-amber-800 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all">
              Espace Membre
            </Button>
          </Link>

          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full text-slate-600 hover:bg-amber-50 hover:text-amber-900 transition-colors"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Menu mobile déroulant */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-slate-100 bg-white/95 backdrop-blur-md px-4 py-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center py-3 px-4 text-sm font-medium text-slate-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
