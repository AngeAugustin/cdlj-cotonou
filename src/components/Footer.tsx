import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { CDLJ_LOGO_SRC } from "@/config/brand";
import { SocialIconLinks } from "@/components/SocialFollowButtons";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/60 pt-10 sm:pt-12 md:pt-16 pb-6 sm:pb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 sm:w-1/3 h-full bg-gradient-to-bl from-amber-50/50 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 mb-10 sm:mb-12 md:mb-16">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4 sm:space-y-6 text-left">
            <div className="flex items-center gap-3 justify-start">
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-full border border-amber-100 shadow-sm bg-white shrink-0">
                <Image
                  src={CDLJ_LOGO_SRC}
                  alt="Logo CDLJ Cotonou"
                  fill
                  className="object-contain p-1"
                />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-amber-900">
                CDLJ WEBAPP
              </span>
            </div>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-sm">
              Site officiel de la Communauté Diocésaine des Lecteurs Juniors (CDLJ) de l&apos;Archidiocèse de Cotonou, Bénin. Formation liturgique, actualités et vie de la communauté.
            </p>
            <SocialIconLinks />
          </div>

          {/* Explorer */}
          <nav className="lg:col-span-2 lg:col-start-5" aria-label="Explorer le site">
            <h3 className="text-slate-900 font-bold mb-4 sm:mb-6 tracking-wide uppercase text-xs sm:text-sm text-left">
              Explorer
            </h3>
            <ul className="space-y-3 sm:space-y-4 text-sm text-slate-500 font-medium text-left">
              <li>
                <Link href="/" prefetch className="hover:text-amber-900 inline-block transition-colors">Accueil</Link>
              </li>
              <li>
                <Link href="/news" prefetch className="hover:text-amber-900 inline-block transition-colors">Blog & Actualités</Link>
              </li>
              <li>
                <Link href="/mediatheque" prefetch className="hover:text-amber-900 inline-block transition-colors">Médiathèque</Link>
              </li>
              <li>
                <Link href="/about" prefetch className="hover:text-amber-900 inline-block transition-colors">À Propos</Link>
              </li>
            </ul>
          </nav>

          {/* Communauté */}
          <nav className="lg:col-span-2 lg:col-start-7" aria-label="Communauté CDLJ">
            <h3 className="text-slate-900 font-bold mb-4 sm:mb-6 tracking-wide uppercase text-xs sm:text-sm text-left">
              Communauté
            </h3>
            <ul className="space-y-3 sm:space-y-4 text-sm text-slate-500 font-medium text-left">
              <li>
                <Link href="/nos-vicariats" prefetch className="hover:text-amber-900 inline-block transition-colors">Vicariats</Link>
              </li>
              <li>
                <Link href="/forums" prefetch className="hover:text-amber-900 inline-block transition-colors">Forums</Link>
              </li>
              <li>
                <Link href="/auth/login" prefetch className="hover:text-amber-900 inline-block transition-colors text-amber-700">Accès Portail</Link>
              </li>
            </ul>
          </nav>

          {/* Contact */}
          <div className="sm:col-span-2 lg:col-span-3 lg:col-start-10">
            <h3 className="text-slate-900 font-bold mb-4 sm:mb-6 tracking-wide uppercase text-xs sm:text-sm text-left">
              Contactez-nous
            </h3>
            <ul className="space-y-3 sm:space-y-4 text-sm text-slate-500">
              <li className="flex items-start gap-3 justify-start">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-amber-900 shrink-0 mt-0.5" />
                <span className="leading-snug text-left">Centre Paul VI<br />Cotonou, Bénin</span>
              </li>
              <li className="flex items-center gap-3 justify-start">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-amber-900 shrink-0" />
                <a href="mailto:contact@cdlj-cotonou.com" className="hover:text-amber-900 transition-colors break-all">
                  contact@cdlj-cotonou.com
                </a>
              </li>
              <li className="flex items-center gap-3 justify-start">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-amber-900 shrink-0" />
                <span>+229 00 00 00 00</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-200/60 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs sm:text-sm text-slate-400 gap-3 sm:gap-4 text-left">
          <p className="font-medium text-slate-500">
            © {new Date().getFullYear()} <span className="text-amber-900">CDLJ</span>. Tous droits réservés.
          </p>
          <Link
            href="/confidentialite"
            prefetch
            className="hover:text-amber-900 transition-colors font-medium"
          >
            Confidentialité & cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}
