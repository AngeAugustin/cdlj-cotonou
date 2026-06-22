import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/JsonLd";
import { PAGE_SEO } from "@/config/page-seo";
import { createPageMetadata } from "@/lib/seo";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo-schemas";

const seo = PAGE_SEO.confidentialite;

export const metadata = createPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/confidentialite",
  keywords: [...seo.keywords],
});

export default function ConfidentialitePage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Accueil", path: "/" },
            { name: "Confidentialité", path: "/confidentialite" },
          ]),
          webPageSchema({
            name: seo.title,
            description: seo.description,
            path: "/confidentialite",
          }),
        ]}
      />

      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex flex-col mb-12 text-center md:text-left">
          <Badge className="bg-amber-100 text-amber-900 w-max mb-4 hover:bg-amber-200 mx-auto md:mx-0">
            Informations légales
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            Confidentialité & cookies — CDLJ Cotonou
          </h1>
          <p className="mt-4 text-xl text-slate-500 max-w-2xl mx-auto md:mx-0">
            {seo.description}
          </p>
        </div>

        <article className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12 text-slate-700 leading-relaxed">
          <p className="text-slate-500 text-sm mb-10 pb-8 border-b border-slate-100">
            Communauté Diocésaine des Lecteurs Juniors (CDLJ) — Cotonou, Bénin
          </p>

          <h2 className="text-xl font-extrabold text-slate-900 mt-0 mb-3">1. Responsable du traitement</h2>
          <p>
            Le site CDLJ WEBAPP est édité par la Communauté Diocésaine des Lecteurs Juniors de
            l&apos;Archidiocèse de Cotonou. Pour toute question :{" "}
            <a href="mailto:contact@cdlj-cotonou.com" className="text-amber-900 font-semibold hover:underline">
              contact@cdlj-cotonou.com
            </a>
            .
          </p>

          <h2 className="text-xl font-extrabold text-slate-900 mt-8 mb-3">2. Cookies utilisés</h2>
          <p>Nous utilisons les cookies suivants sur l&apos;espace public :</p>

          <h3 className="text-lg font-bold text-slate-800 mt-5 mb-2">Cookie de consentement (`cdlj_cookie_consent`)</h3>
          <p>
            Enregistre votre choix (accepté ou refusé) concernant les cookies d&apos;engagement.
            Durée : 12 mois.
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-5 mb-2">Cookie visiteur anonyme (`cdlj_visitor_id`)</h3>
          <p>
            Identifiant technique anonyme, posé uniquement si vous acceptez les cookies
            d&apos;engagement. Il permet d&apos;éviter les likes multiples et d&apos;associer vos
            interactions (likes, commentaires) à votre navigateur. Durée : 12 mois. Cookie
            httpOnly (non accessible en JavaScript).
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-5 mb-2">Cookie de session (portail connecté)</h3>
          <p>
            Si vous vous connectez au portail membre, NextAuth utilise un cookie de session
            strictement nécessaire à l&apos;authentification.
          </p>

          <h2 className="text-xl font-extrabold text-slate-900 mt-8 mb-3">3. Données collectées via l&apos;engagement public</h2>
          <p>Lorsque vous acceptez les cookies et interagissez avec nos actualités, nous pouvons enregistrer :</p>
          <ul className="list-disc pl-6 space-y-1 my-4">
            <li>Le nombre de vues de chaque article (chaque chargement de page)</li>
            <li>Vos likes (1 par navigateur / adresse IP)</li>
            <li>Vos commentaires (prénom saisi + texte)</li>
            <li>Une estimation géographique (pays, ville/région) dérivée de votre adresse IP</li>
            <li>Un hash anonyme de votre adresse IP (nous ne stockons pas l&apos;IP en clair)</li>
          </ul>

          <h2 className="text-xl font-extrabold text-slate-900 mt-8 mb-3">4. Finalité</h2>
          <p>
            Ces données servent à mesurer l&apos;audience des actualités, modérer les commentaires
            et comprendre la répartition géographique des visiteurs. Elles ne sont pas vendues à des tiers.
          </p>

          <h2 className="text-xl font-extrabold text-slate-900 mt-8 mb-3">5. Vos choix</h2>
          <ul className="list-disc pl-6 space-y-1 my-4">
            <li>
              <strong>Refuser</strong> : vous pouvez consulter les articles sans enregistrement de vue
              ni interaction. Les compteurs affichés restent visibles en lecture seule.
            </li>
            <li>
              <strong>Accepter</strong> : vos vues, likes et commentaires sont enregistrés selon les
              règles décrites ci-dessus.
            </li>
            <li>
              Vous pouvez supprimer les cookies via les paramètres de votre navigateur ; la bannière
              de consentement réapparaîtra lors de votre prochaine visite.
            </li>
          </ul>

          <h2 className="text-xl font-extrabold text-slate-900 mt-8 mb-3">6. Anti-spam</h2>
          <p>
            Pour limiter les abus, un même visiteur (identifié par adresse IP) ne peut publier qu&apos;un
            commentaire toutes les 5 minutes.
          </p>

          <h2 className="text-xl font-extrabold text-slate-900 mt-8 mb-3">7. Durée de conservation</h2>
          <p>
            Les commentaires et statistiques d&apos;engagement sont conservés tant que l&apos;article
            concerné est publié, sauf suppression par un administrateur.
          </p>

          <p className="pt-8 border-t border-slate-100 mt-10">
            <Link href="/" prefetch className="text-amber-900 font-semibold hover:underline">
              ← Retour à l&apos;accueil
            </Link>
          </p>
        </article>
      </div>
    </div>
  );
}
