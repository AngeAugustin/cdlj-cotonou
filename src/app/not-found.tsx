import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Page introuvable",
  description: "La page que vous recherchez n'existe pas ou a été déplacée.",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-amber-700 mb-3">
        Erreur 404
      </p>
      <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
        Page introuvable
      </h1>
      <p className="text-slate-500 max-w-md mb-8">
        Cette adresse n&apos;existe pas. Retournez à l&apos;accueil ou explorez nos pages publiques.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex items-center bg-amber-900 hover:bg-amber-800 text-white font-bold px-6 py-3 rounded-full transition-colors"
        >
          Accueil
        </Link>
        <Link
          href="/news"
          className="inline-flex items-center border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 rounded-full transition-colors"
        >
          Actualités
        </Link>
        <Link
          href="/nos-vicariats"
          className="inline-flex items-center border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 rounded-full transition-colors"
        >
          Nos vicariats
        </Link>
      </div>
    </div>
  );
}
