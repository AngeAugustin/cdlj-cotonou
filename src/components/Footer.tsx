import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/60 pt-16 pb-8 relative overflow-hidden">
      {/* Subtle decorative background element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-bl from-amber-50/50 to-transparent pointer-events-none" />

      <div className="container mx-auto px-8 md:px-16 lg:px-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Section */}
          <div className="md:col-span-5 lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-amber-100 shadow-sm bg-white">
                <Image 
                  src="https://i.postimg.cc/BnnDpTc2/CDLJ.png" 
                  alt="Logo CDLJ" 
                  fill 
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
              <span className="text-2xl font-black tracking-tight text-amber-900">
                CDLJ WEBAPP
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed max-w-sm">
              Plateforme officielle de gestion des activités de la Communauté Diocésaine 
              des Lecteurs Juniors de Cotonou. Construisons ensemble l'avenir de notre communauté.
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="md:col-span-3 lg:col-span-2 lg:col-start-7">
            <h3 className="text-slate-900 font-bold mb-6 tracking-wide uppercase text-sm">Navigation</h3>
            <ul className="space-y-4 text-slate-500 font-medium">
              <li>
                <Link href="/" className="hover:text-amber-900 hover:translate-x-1 inline-block transition-all">Accueil</Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-amber-900 hover:translate-x-1 inline-block transition-all">Blog & Actualités</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-amber-900 hover:translate-x-1 inline-block transition-all">À Propos</Link>
              </li>
              <li>
                <Link href="/nos-vicariats" className="hover:text-amber-900 hover:translate-x-1 inline-block transition-all">Vicariats</Link>
              </li>
              <li>
                <Link href="/forums" className="hover:text-amber-900 hover:translate-x-1 inline-block transition-all">Forums communautaires</Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-amber-900 hover:translate-x-1 inline-block transition-all text-amber-700">Accès Portail</Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="md:col-span-4 lg:col-span-3 lg:col-start-10">
            <h3 className="text-slate-900 font-bold mb-6 tracking-wide uppercase text-sm">Contactez-nous</h3>
            <ul className="space-y-4 text-slate-500">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-900 shrink-0 mt-0.5" />
                <span className="leading-snug">Archidiocèse de Cotonou<br/>Cotonou, Bénin</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-900 shrink-0" />
                <a href="mailto:contact@cdlj.com" className="hover:text-amber-900 transition-colors">contact@cdlj.com</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-amber-900 shrink-0" />
                <span>+229 00 00 00 00</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200/60 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400 gap-4">
          <p className="font-medium text-slate-500">
            © {new Date().getFullYear()} <span className="text-amber-900">CDLJ</span>. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 font-medium">
            <Link href="#" className="hover:text-amber-900 transition-colors">Politique de confidentialité</Link>
            <Link href="#" className="hover:text-amber-900 transition-colors">Mentions légales</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
